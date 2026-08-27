/**
 * Customers: list/top, acquisition, repeat behaviour, cohorts, geo, RFM.
 */
import { resolveRange, assertInterval, sliceByTs, bucketKey, bucketLabel, fillMissingBuckets, paginate, round2, DAY, MONTHS, monthIndex, memo, round4 } from "./util.js";
import { resolveCity, resolveLocal } from "../data/geocode.js";

// ---------- RFM ----------
export const RFM_SEGMENTS = {
  Champions: "Bought recently, buy often and spend the most. Reward them; they can become early adopters and promoters.",
  Loyal: "Buy regularly and respond well to promotions. Upsell higher-value products and ask for reviews.",
  "Potential Loyalist": "Recent customers with average frequency. Offer membership or loyalty programs to deepen the relationship.",
  New: "Bought very recently but only once. Provide onboarding support and start building the relationship.",
  Promising: "Recent shoppers who haven't spent much yet. Create brand awareness and offer free trials.",
  "Need Attention": "Above-average recency, frequency and monetary values but haven't bought very recently. Make limited-time offers.",
  "About To Sleep": "Below-average recency and frequency. Reactivate with popular products and discounts before they are lost.",
  "At Risk": "Spent big and purchased often, but a long time ago. Bring them back with personalised campaigns.",
  Hibernating: "Last purchase was long ago with low spend and few orders. Offer relevant products and special discounts.",
  Lost: "Lowest recency, frequency and monetary scores. Revive interest with a reach-out campaign; otherwise ignore.",
};

function quintileScores(values, higherIsBetter = true) {
  // rank-based quintiles; ties share the score of their first occurrence
  const idx = values.map((v, i) => i).sort((a, b) => values[a] - values[b]);
  const scores = new Array(values.length).fill(1);
  const n = values.length;
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && values[idx[j + 1]] === values[idx[i]]) j++;
    const q = Math.min(5, Math.floor((i / n) * 5) + 1);
    const score = higherIsBetter ? q : 6 - q;
    for (let k = i; k <= j; k++) scores[idx[k]] = score;
    i = j + 1;
  }
  return scores;
}

export function segmentFor(r, f, m) {
  const fm = Math.round((f + m) / 2);
  if (r >= 4 && fm >= 4) return "Champions";
  if (r >= 3 && fm >= 3) return "Loyal";
  if (r <= 2 && fm >= 4) return "At Risk";
  if (r >= 2 && r <= 3 && fm >= 2 && fm <= 3) return "Need Attention";
  if (r >= 4 && fm >= 2) return "Potential Loyalist";
  if (r >= 4) return "New";
  if (r === 3) return "Promising";
  if (r === 2) return "About To Sleep";
  if (fm >= 2) return "Hibernating";
  return "Lost";
}

/** RFM table for every customer with >= 1 order. Memoised per loaded state. */
export function rfmTable(state, now = Date.now()) {
  const nowTs = new Date(now).getTime();
  return memo(state, `rfm:${Math.floor(nowTs / 3_600_000)}`, () => {
    const ids = [];
    const recency = [];
    const frequency = [];
    const monetary = [];
    for (const [id, s] of state.indexes.customerStats) {
      ids.push(id);
      recency.push(Math.max(0, Math.round((nowTs - s.lastTs) / DAY)));
      frequency.push(s.orders);
      monetary.push(s.revenue);
    }
    const rScore = quintileScores(recency, false);
    const mScore = quintileScores(monetary, true);
    // frequency: single order => 1, otherwise quintiles (2..5) among multi-order customers
    const multiIdx = frequency.map((f, i) => (f > 1 ? i : -1)).filter((i) => i >= 0);
    const multiScores = quintileScores(multiIdx.map((i) => frequency[i]), true);
    const fScore = new Array(frequency.length).fill(1);
    multiIdx.forEach((i, k) => (fScore[i] = Math.max(2, multiScores[k])));
    const table = new Map();
    ids.forEach((id, i) => {
      table.set(id, {
        recency: recency[i],
        frequency: frequency[i],
        monetary: round2(monetary[i]),
        r: rScore[i],
        f: fScore[i],
        m: mScore[i],
        segment: segmentFor(rScore[i], fScore[i], mScore[i]),
      });
    });
    return table;
  });
}

export function getRfm(state, { now = Date.now() } = {}) {
  const table = rfmTable(state, now);
  const seg = new Map(Object.keys(RFM_SEGMENTS).map((s) => [s, { segment: s, count: 0, revenue: 0, share: 0, description: RFM_SEGMENTS[s] }]));
  let total = 0;
  for (const row of table.values()) {
    const s = seg.get(row.segment);
    s.count += 1;
    s.revenue += row.monetary;
    total += 1;
  }
  const segments = [...seg.values()].map((s) => ({ ...s, revenue: round2(s.revenue), share: total ? round4(s.count / total) : 0 }));
  // scatter: deterministic sample of up to 600 customers
  const rows = [...table.values()];
  const stride = Math.max(1, Math.floor(rows.length / 600));
  const scatter = rows.filter((_, i) => i % stride === 0).slice(0, 600).map((r) => ({ recency: r.recency, frequency: r.frequency, monetary: r.monetary, segment: r.segment }));
  return { segments, scatter, total };
}

// ---------- rows ----------
function customerRows(state, now) {
  return memo(state, `customerRows:${Math.floor(new Date(now).getTime() / 3_600_000)}`, () => {
    const rfm = rfmTable(state, now);
    return state.customers.map((c) => {
      const s = state.indexes.customerStats.get(c.id);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt ? c.createdAt.toISOString() : null,
        city: c.city,
        country: c.country,
        orders: s?.orders ?? 0,
        totalSpent: round2(s?.revenue ?? 0),
        aov: s?.orders ? round2(s.revenue / s.orders) : 0,
        lastOrderAt: s ? new Date(s.lastTs).toISOString() : null,
        segment: rfm.get(c.id)?.segment ?? "Inactive",
      };
    });
  });
}

export function listCustomers(state, { page, limit, search, sort, now = Date.now() } = {}) {
  return paginate(customerRows(state, now), {
    page,
    limit,
    search,
    sort,
    defaultSort: "totalSpent:desc",
    searchFields: ["name", "email", "city", "country", "segment"],
  });
}

export function topCustomers(state, { limit = 10, now = Date.now() } = {}) {
  const n = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  return [...customerRows(state, now)].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, n);
}

// ---------- acquisition / repeat ----------
export function newCustomers(state, { interval = "monthly", range = "12m", now = Date.now() } = {}) {
  assertInterval(interval);
  const r = resolveRange(range, now, state.indexes.earliestTs);
  const fromTs = r.from.getTime();
  const toTs = r.to.getTime();
  const map = new Map();
  let before = 0;
  for (const c of state.customers) {
    if (c.ts == null) continue;
    if (c.ts < fromTs) before++;
    if (c.ts >= fromTs && c.ts <= toTs) {
      const key = bucketKey(c.createdAt, interval);
      map.set(key, { count: (map.get(key)?.count ?? 0) + 1 });
    }
  }
  let cumulative = before; // customers acquired before the window, so `cumulative` is the running total
  return fillMissingBuckets(map, interval, r.from, r.to, () => ({ count: 0 })).map((b) => {
    cumulative += b.count;
    return { ...b, cumulative };
  });
}

/**
 * repeat customer in a period = customer with >= 2 lifetime orders who placed an order in the period
 * (original README semantics). totalCustomers = distinct customers ordering in the period.
 */
export function repeatCustomers(state, { interval = "monthly", range = "12m", now = Date.now() } = {}) {
  assertInterval(interval);
  const r = resolveRange(range, now, state.indexes.earliestTs);
  const { customerStats } = state.indexes;
  const map = new Map();
  for (const o of sliceByTs(state.orders, r.from, r.to)) {
    if (!o.customerId) continue;
    const key = bucketKey(o.createdAt, interval);
    let b = map.get(key);
    if (!b) map.set(key, (b = { all: new Set(), repeat: new Set() }));
    b.all.add(o.customerId);
    if ((customerStats.get(o.customerId)?.orders ?? 0) >= 2) b.repeat.add(o.customerId);
  }
  const rows = new Map();
  for (const [key, b] of map) {
    rows.set(key, {
      repeatCustomers: b.repeat.size,
      totalCustomers: b.all.size,
      repeatRate: b.all.size ? round4(b.repeat.size / b.all.size) : 0,
    });
  }
  return fillMissingBuckets(rows, interval, r.from, r.to, () => ({ repeatCustomers: 0, totalCustomers: 0, repeatRate: 0 }));
}

// ---------- cohorts ----------
export function cohorts(state, { months = 12, now = Date.now() } = {}) {
  const n = Math.min(36, Math.max(1, parseInt(months, 10) || 12));
  const nowDate = new Date(now);
  const nowIdx = monthIndex(nowDate);
  const firstIdx = nowIdx - n + 1;
  const { ordersByCustomer, customerStats } = state.indexes;
  const table = new Map(); // cohortIdx -> { customers:Set, revenue, active: Map<k, Set> }
  for (const [cid, s] of customerStats) {
    const cIdx = monthIndex(new Date(s.firstTs));
    if (cIdx < firstIdx || cIdx > nowIdx) continue;
    let c = table.get(cIdx);
    if (!c) table.set(cIdx, (c = { customers: new Set(), revenue: 0, active: new Map() }));
    c.customers.add(cid);
    c.revenue += s.revenue;
    for (const o of ordersByCustomer.get(cid) ?? []) {
      const k = monthIndex(o.createdAt) - cIdx;
      if (k < 0) continue;
      let set = c.active.get(k);
      if (!set) c.active.set(k, (set = new Set()));
      set.add(cid);
    }
  }
  const out = [];
  for (let idx = firstIdx; idx <= nowIdx; idx++) {
    const y = Math.floor(idx / 12);
    const m = idx % 12;
    const cohort = `${y}-${String(m + 1).padStart(2, "0")}`;
    const c = table.get(idx);
    const size = c?.customers.size ?? 0;
    const horizon = nowIdx - idx; // months observable so far
    const retention = [];
    for (let k = 0; k <= horizon && k < n; k++) {
      const active = c?.active.get(k)?.size ?? 0;
      retention.push(size ? (k === 0 ? 100 : round2((active / size) * 100)) : 0);
    }
    out.push({
      cohort,
      label: `${MONTHS[m]} ${y}`,
      customers: size,
      revenue: round2(c?.revenue ?? 0),
      ltv: size ? round2((c?.revenue ?? 0) / size) : 0,
      retention,
    });
  }
  return out;
}

// ---------- geo ----------
export async function geo(state) {
  const groups = new Map(); // key -> { city, country, lat, lng, customers:Set, revenue, orders }
  const keyOf = (city, country) => `${String(city).trim().toLowerCase()}|${String(country ?? "").trim().toLowerCase()}`;
  let unknown = 0;
  // orders carry the revenue; customers without orders still count as customers
  for (const o of state.orders) {
    if (!o.city) {
      unknown++;
      continue;
    }
    const k = keyOf(o.city, o.country);
    let g = groups.get(k);
    if (!g) groups.set(k, (g = { city: o.city, country: o.country, lat: o.lat, lng: o.lng, customers: new Set(), revenue: 0, orders: 0 }));
    g.revenue += o.total;
    g.orders += 1;
    if (o.customerId) g.customers.add(o.customerId);
    if (g.lat == null && o.lat != null) {
      g.lat = o.lat;
      g.lng = o.lng;
    }
  }
  for (const c of state.customers) {
    if (!c.city) continue;
    if (state.indexes.customerStats.has(c.id)) continue; // already represented through orders
    const k = keyOf(c.city, c.country);
    let g = groups.get(k);
    if (!g) groups.set(k, (g = { city: c.city, country: c.country, lat: c.lat, lng: c.lng, customers: new Set(), revenue: 0, orders: 0 }));
    g.customers.add(c.id);
  }
  const points = [];
  for (const g of groups.values()) {
    if (g.lat == null || g.lng == null) {
      const hit = await resolveCity(g.city, g.country);
      if (!hit) {
        unknown += g.customers.size || g.orders;
        continue;
      }
      g.lat = hit.lat;
      g.lng = hit.lng;
      g.country = g.country ?? hit.country;
      g.countryCode = g.countryCode ?? hit.countryCode;
    }
    // ISO code (for flags / short labels) from the bundled city table when the record didn't carry one
    const code = g.countryCode ?? resolveLocal(g.city, g.country)?.countryCode ?? null;
    points.push({ city: g.city, country: g.country, countryCode: code, lat: g.lat, lng: g.lng, customers: g.customers.size, revenue: round2(g.revenue), orders: g.orders });
  }
  points.sort((a, b) => b.revenue - a.revenue);
  return { points, unknown };
}
