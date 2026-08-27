/**
 * Sales analytics: timeseries, growth, heatmap, forecast, channels, categories.
 */
import { resolveRange, assertInterval, sliceByTs, bucketKey, bucketLabel, fillMissingBuckets, round2, pct, mean, stddev, addMonthsUTC, round4 } from "./util.js";

const emptyBucket = () => ({ revenue: 0, orders: 0, units: 0, aov: 0, newCustomers: 0 });

export function getTimeseries(state, { interval = "monthly", range = "12m", now = Date.now() } = {}) {
  assertInterval(interval);
  const r = resolveRange(range, now, state.indexes.earliestTs);
  const orders = sliceByTs(state.orders, r.from, r.to);
  const map = new Map();
  const get = (key) => {
    let b = map.get(key);
    if (!b) map.set(key, (b = emptyBucket()));
    return b;
  };
  for (const o of orders) {
    const b = get(bucketKey(o.createdAt, interval));
    b.revenue += o.total;
    b.orders += 1;
    b.units += o.units;
  }
  const fromTs = r.from.getTime();
  const toTs = r.to.getTime();
  for (const c of state.customers) {
    if (c.ts != null && c.ts >= fromTs && c.ts <= toTs) get(bucketKey(c.createdAt, interval)).newCustomers += 1;
  }
  return fillMissingBuckets(map, interval, r.from, r.to, emptyBucket).map((b) => ({
    ...b,
    revenue: round2(b.revenue),
    aov: b.orders ? round2(b.revenue / b.orders) : 0,
  }));
}

export function getGrowth(state, { interval = "monthly" } = {}) {
  assertInterval(interval, ["monthly", "quarterly", "yearly"]);
  if (!state.orders.length) return [];
  const map = new Map();
  for (const o of state.orders) {
    const key = bucketKey(o.createdAt, interval);
    map.set(key, { revenue: (map.get(key)?.revenue ?? 0) + o.total });
  }
  const rows = fillMissingBuckets(map, interval, new Date(state.indexes.minTs), new Date(state.indexes.maxTs), () => ({ revenue: 0 }));
  return rows.map((row, i) => {
    const previousRevenue = i === 0 ? null : round2(rows[i - 1].revenue);
    return {
      period: row.period,
      label: row.label,
      revenue: round2(row.revenue),
      previousRevenue,
      growthRate: previousRevenue ? pct(row.revenue, previousRevenue) : null,
    };
  });
}

/** 168 cells: day-of-week (0=Sun) x hour (UTC). */
export function getHeatmap(state, { range = "12m", now = Date.now() } = {}) {
  const r = resolveRange(range, now, state.indexes.earliestTs);
  const cells = [];
  for (let dow = 0; dow < 7; dow++) for (let hour = 0; hour < 24; hour++) cells.push({ dow, hour, orders: 0, revenue: 0 });
  for (const o of sliceByTs(state.orders, r.from, r.to)) {
    const c = cells[o.createdAt.getUTCDay() * 24 + o.createdAt.getUTCHours()];
    c.orders += 1;
    c.revenue += o.total;
  }
  for (const c of cells) c.revenue = round2(c.revenue);
  return cells;
}

/**
 * Forecast method
 * ---------------
 * 1. Monthly revenue history (complete months only; the current partial month is excluded from the fit).
 * 2. Multiplicative seasonal indices per calendar month (seasonal naive): mean of that month / overall mean,
 *    only when >= 24 months of history, otherwise all indices = 1.
 * 3. Holt's linear trend (double exponential smoothing, alpha = 0.5, beta = 0.3) on the de-seasonalised series:
 *      level_t = a*y_t + (1-a)*(level_{t-1} + trend_{t-1})
 *      trend_t = b*(level_t - level_{t-1}) + (1-b)*trend_{t-1}
 * 4. Forecast h months ahead = (level + h*trend) * seasonal[month], with a band of
 *    +/- 1.28 * std(one-step residuals) * seasonal[month] (~80% interval assuming normal residuals).
 */
export function getForecast(state, { months = 6, now = Date.now() } = {}) {
  const h = Math.min(24, Math.max(1, parseInt(months, 10) || 6));
  const nowDate = new Date(now);
  const currentMonthKey = bucketKey(nowDate, "monthly");
  const map = new Map();
  for (const o of state.orders) {
    const key = bucketKey(o.createdAt, "monthly");
    if (key >= currentMonthKey) continue;
    map.set(key, { revenue: (map.get(key)?.revenue ?? 0) + o.total });
  }
  if (!map.size) return { history: [], forecast: [], method: "holt-linear+seasonal-naive" };
  const lastComplete = addMonthsUTC(new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), 1)), -1);
  const history = fillMissingBuckets(map, "monthly", new Date(state.indexes.minTs), lastComplete, () => ({ revenue: 0 }));
  const y = history.map((b) => b.revenue);

  // seasonal indices
  const seasonal = new Array(12).fill(1);
  if (y.length >= 24) {
    const overall = mean(y) || 1;
    const byMonth = Array.from({ length: 12 }, () => []);
    history.forEach((b, i) => byMonth[Number(b.period.slice(5, 7)) - 1].push(y[i]));
    byMonth.forEach((vals, m) => {
      if (vals.length) seasonal[m] = mean(vals) / overall || 1;
    });
  }
  const monthOf = (period) => Number(period.slice(5, 7)) - 1;
  const ds = history.map((b, i) => y[i] / seasonal[monthOf(b.period)]);

  // Holt's linear trend
  const alpha = 0.5;
  const beta = 0.3;
  let level = ds[0];
  let trend = ds.length > 1 ? ds[1] - ds[0] : 0;
  const residuals = [];
  for (let t = 1; t < ds.length; t++) {
    const pred = level + trend;
    residuals.push(ds[t] - pred);
    const prevLevel = level;
    level = alpha * ds[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  const sigma = stddev(residuals);
  const forecast = [];
  for (let k = 1; k <= h; k++) {
    const d = addMonthsUTC(lastComplete, k);
    const period = bucketKey(d, "monthly");
    const s = seasonal[d.getUTCMonth()];
    const point = Math.max(0, (level + k * trend) * s);
    const band = 1.28 * sigma * s;
    forecast.push({
      period,
      label: bucketLabel(period, "monthly"),
      revenue: round2(point),
      lower: round2(Math.max(0, point - band)),
      upper: round2(point + band),
    });
  }
  return {
    history: history.map((b) => ({ period: b.period, label: b.label, revenue: round2(b.revenue) })),
    forecast,
    method: "Holt linear trend (alpha 0.5, beta 0.3) on seasonally-adjusted monthly revenue; band = +/-1.28 x residual std",
  };
}

export function getChannels(state, { range = "12m", now = Date.now() } = {}) {
  const r = resolveRange(range, now, state.indexes.earliestTs);
  const map = new Map();
  let total = 0;
  for (const o of sliceByTs(state.orders, r.from, r.to)) {
    const key = o.channel || "web";
    const b = map.get(key) ?? { channel: key, revenue: 0, orders: 0 };
    b.revenue += o.total;
    b.orders += 1;
    total += o.total;
    map.set(key, b);
  }
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .map((b) => ({ ...b, revenue: round2(b.revenue), share: total ? round4(b.revenue / total) : 0 }));
}

export function categoryOf(state, productId) {
  const p = productId ? state.indexes.productById.get(productId) : null;
  return p?.category ?? "Uncategorized";
}

export function getCategories(state, { range = "12m", now = Date.now() } = {}) {
  const r = resolveRange(range, now, state.indexes.earliestTs);
  const map = new Map();
  let total = 0;
  for (const o of sliceByTs(state.orders, r.from, r.to)) {
    const seen = new Set();
    for (const li of o.lineItems) {
      const key = categoryOf(state, li.productId);
      const b = map.get(key) ?? { category: key, revenue: 0, units: 0, orders: 0 };
      const rev = li.price * li.quantity;
      b.revenue += rev;
      b.units += li.quantity;
      total += rev;
      if (!seen.has(key)) {
        b.orders += 1;
        seen.add(key);
      }
      map.set(key, b);
    }
  }
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .map((b) => ({ ...b, revenue: round2(b.revenue), share: total ? round4(b.revenue / total) : 0 }));
}
