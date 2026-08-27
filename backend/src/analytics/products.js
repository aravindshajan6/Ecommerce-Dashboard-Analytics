/**
 * Products: catalog performance, top sellers, inventory health.
 */
import { resolveRange, sliceByTs, paginate, round2, DAY, memo } from "./util.js";

const LOW_STOCK_THRESHOLD = 10;

export function stockStatus(stock) {
  if (stock == null) return "healthy"; // unknown inventory: do not raise alarms
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low";
  return "healthy";
}

/**
 * Per-product stats for orders in [from, to] with an 8-point units trend.
 * Includes products that appear in line items but are missing from the catalog.
 */
export function productStats(state, from, to) {
  const orders = sliceByTs(state.orders, from, to);
  const fromTs = from ? new Date(from).getTime() : state.indexes.minTs ?? 0;
  const toTs = to ? new Date(to).getTime() : state.indexes.maxTs ?? fromTs + 1;
  const step = Math.max(1, (toTs - fromTs) / 8);
  const stats = new Map();
  const ensure = (id, li) => {
    let s = stats.get(id);
    if (!s) {
      const p = id ? state.indexes.productById.get(id) : null;
      s = {
        id: id ?? `unknown:${li?.name ?? "item"}`,
        title: p?.title ?? li?.name ?? "Unknown product",
        category: p?.category ?? "Uncategorized",
        vendor: p?.vendor ?? "Unknown",
        price: p?.price ?? li?.price ?? 0,
        stock: p?.stock ?? null,
        sku: p?.sku ?? li?.sku ?? null,
        revenue: 0,
        units: 0,
        orders: 0,
        trend: new Array(8).fill(0),
        _orders: new Set(),
      };
      stats.set(id, s);
    }
    return s;
  };
  for (const o of orders) {
    const slot = Math.min(7, Math.floor((o.ts - fromTs) / step));
    for (const li of o.lineItems) {
      const key = li.productId ?? `unknown:${li.name}`;
      const s = ensure(key, li);
      s.revenue += li.price * li.quantity;
      s.units += li.quantity;
      s.trend[slot] += li.quantity;
      s._orders.add(o.id);
    }
  }
  return stats;
}

function buildRows(state, from, to) {
  const stats = productStats(state, from, to);
  const rows = [];
  for (const p of state.products) {
    const s = stats.get(p.id);
    rows.push({
      id: p.id,
      title: p.title,
      category: p.category,
      vendor: p.vendor,
      sku: p.sku,
      price: round2(p.price),
      stock: p.stock,
      revenue: round2(s?.revenue ?? 0),
      units: s?.units ?? 0,
      orders: s?._orders.size ?? 0,
      trend: s?.trend ?? new Array(8).fill(0),
      status: stockStatus(p.stock),
    });
    stats.delete(p.id);
  }
  // products only seen in line items
  for (const s of stats.values()) {
    rows.push({
      id: s.id,
      title: s.title,
      category: s.category,
      vendor: s.vendor,
      sku: s.sku,
      price: round2(s.price),
      stock: null,
      revenue: round2(s.revenue),
      units: s.units,
      orders: s._orders.size,
      trend: s.trend,
      status: "healthy",
    });
  }
  return rows;
}

function rowsForRange(state, range, now) {
  const r = resolveRange(range, now, state.indexes.earliestTs);
  // memoised per range for the lifetime of a loaded state (cleared on refresh)
  const key = `products:${range}:${Math.floor(new Date(now).getTime() / 60_000)}`;
  return memo(state, key, () => buildRows(state, r.from, r.to));
}

export function listProducts(state, { page, limit, search, sort, range = "12m", now = Date.now() } = {}) {
  const rows = rowsForRange(state, range, now);
  return paginate(rows, {
    page,
    limit,
    search,
    sort,
    defaultSort: "revenue:desc",
    searchFields: ["title", "category", "vendor", "sku"],
  });
}

export function topProducts(state, { limit = 10, by = "units", range = "12m", now = Date.now() } = {}) {
  const n = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const field = by === "revenue" ? "revenue" : "units";
  return [...rowsForRange(state, range, now)].sort((a, b) => b[field] - a[field]).slice(0, n);
}

export function inventory(state, { now = Date.now() } = {}) {
  const nowTs = new Date(now).getTime();
  const recent = productStats(state, nowTs - 90 * DAY, nowTs);
  let healthy = 0;
  let low = 0;
  let out = 0;
  let value = 0;
  const alerts = [];
  for (const p of state.products) {
    const status = stockStatus(p.stock);
    if (status === "out") out++;
    else if (status === "low") low++;
    else healthy++;
    value += Math.max(0, p.stock ?? 0) * (p.price ?? 0);
    if (status !== "healthy") {
      const units90 = recent.get(p.id)?.units ?? 0;
      const velocityPerWeek = round2(units90 / (90 / 7));
      const perDay = units90 / 90;
      alerts.push({
        id: p.id,
        title: p.title,
        category: p.category,
        stock: p.stock,
        status,
        velocityPerWeek,
        daysLeft: status === "out" ? 0 : perDay > 0 ? Math.round(p.stock / perDay) : null,
      });
    }
  }
  alerts.sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity) || b.velocityPerWeek - a.velocityPerWeek);
  return { total: state.products.length, healthy, low, out, value: round2(value), alerts };
}
