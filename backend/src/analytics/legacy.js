/**
 * Legacy (v1) endpoints, reproduced over the in-memory state with their ORIGINAL response shapes.
 */
import { bucketKey, round2, ApiError } from "./util.js";

const LEGACY_INTERVALS = ["daily", "monthly", "quarterly", "yearly"];

/** legacy _id formats: daily/monthly/yearly are strings, quarterly is { year, quarter } */
function legacyId(date, interval) {
  if (interval === "quarterly") return { year: date.getUTCFullYear(), quarter: Math.ceil((date.getUTCMonth() + 1) / 3) };
  return bucketKey(date, interval);
}
const idKey = (id) => (typeof id === "string" ? id : `${id.year}-Q${id.quarter}`);
const normalizeInterval = (interval) => (LEGACY_INTERVALS.includes(interval) ? interval : "yearly");

export function customerCount(state) {
  return { success: true, message: "customers count fetched from DB", customerCount: state.customers.filter((c) => !c.synthetic).length };
}

export function newCustomersAdded(state, { interval } = {}) {
  const iv = normalizeInterval(interval);
  const map = new Map();
  for (const c of state.customers) {
    if (!c.createdAt) continue;
    const id = legacyId(c.createdAt, iv);
    const k = idKey(id);
    const row = map.get(k) ?? { _id: id, count: 0 };
    row.count += 1;
    map.set(k, row);
  }
  const newCustomers = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  return { success: true, message: "New customers data fetched from DB", newCustomers };
}

/** original semantics: count of orders (per period) placed by customers with more than one order */
export function repeatCustomers(state, { interval } = {}) {
  const iv = normalizeInterval(interval);
  const map = new Map();
  for (const o of state.orders) {
    if (!o.customerId) continue;
    if ((state.indexes.customerStats.get(o.customerId)?.orders ?? 0) <= 1) continue;
    const id = legacyId(o.createdAt, iv);
    const k = idKey(id);
    const row = map.get(k) ?? { _id: id, repeatCustomerCount: 0 };
    row.repeatCustomerCount += 1;
    map.set(k, row);
  }
  const repeatCustomers = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  return { success: true, message: "Repeat customer counts data fetched from DB", repeatCustomers };
}

export function clvByCohorts(state) {
  const map = new Map();
  for (const s of state.indexes.customerStats.values()) {
    const k = bucketKey(new Date(s.firstTs), "monthly");
    const row = map.get(k) ?? { _id: k, totalCLV: 0, numberOfCustomers: 0 };
    row.totalCLV += s.revenue;
    row.numberOfCustomers += 1;
    map.set(k, row);
  }
  const rows = [...map.values()].sort((a, b) => a._id.localeCompare(b._id)).map((r) => ({ ...r, totalCLV: round2(r.totalCLV) }));
  return { success: true, message: "Customer Lifetime Value by Cohorts fetched from DB", clvByCohorts: rows };
}

export function geographicalDistribution(state) {
  const map = new Map();
  for (const c of state.customers) {
    if (!c.city) continue;
    map.set(c.city, (map.get(c.city) ?? 0) + 1);
  }
  const geographicalData = [...map.entries()].map(([_id, customerCount]) => ({ _id, customerCount })).sort((a, b) => b.customerCount - a.customerCount);
  return { success: true, message: "Geographical distribution of customers fetched from DB", geographicalData };
}

export function totalOrderCount(state) {
  return { success: true, message: "order count fetched from DB", totalOrders: state.orders.length };
}

export function totalProducts(state) {
  return { success: true, message: "products count fetched from DB", totalProducts: state.products.length };
}

/** original handler was named "top 10" but limited to 8 rows; keep 8 */
export function topProducts(state, { limit = 8 } = {}) {
  const map = new Map();
  for (const o of state.orders) {
    for (const li of o.lineItems) {
      const key = li.productId ?? li.name;
      const row = map.get(key) ?? { _id: li.productId != null && /^\d+$/.test(li.productId) ? Number(li.productId) : li.productId, totalSold: 0, productName: li.name, price: String(li.price) };
      row.totalSold += li.quantity;
      map.set(key, row);
    }
  }
  const topProducts = [...map.values()].sort((a, b) => b.totalSold - a.totalSold).slice(0, limit);
  return { success: true, message: "Top 10 most sold products fetched successfully", topProducts };
}

export function totalSalesAmount(state) {
  const total = state.orders.reduce((s, o) => s + o.total, 0);
  return { success: true, message: "Total sales amount fetched successfully", totalSalesAmount: round2(total) };
}

export function salesData(state, { interval } = {}) {
  if (!LEGACY_INTERVALS.includes(interval)) throw new ApiError(400, "Invalid interval provided!");
  const map = new Map();
  for (const o of state.orders) {
    const id = interval === "yearly" ? o.createdAt.getUTCFullYear() : legacyId(o.createdAt, interval);
    const k = typeof id === "number" ? String(id) : idKey(id);
    const row = map.get(k) ?? { _id: id, totalSales: 0 };
    row.totalSales += o.total;
    map.set(k, row);
  }
  const sales = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => ({ ...v, totalSales: round2(v.totalSales) }));
  return {
    success: true,
    message: `${interval.charAt(0).toUpperCase() + interval.slice(1)} sales data fetched from DB`,
    [`${interval}Sales`]: sales,
  };
}

export function yearlySalesGrowthRate(state) {
  const map = new Map();
  for (const o of state.orders) {
    const y = o.createdAt.getUTCFullYear();
    map.set(y, (map.get(y) ?? 0) + o.total);
  }
  const years = [...map.entries()].sort(([a], [b]) => a - b);
  const yearlySalesGrowthRate = years.map(([year, totalSales], i) => {
    if (i === 0) return { year, totalSales: round2(totalSales), growthRate: null };
    const prev = years[i - 1][1];
    return { year, totalSales: round2(totalSales), growthRate: prev ? `${(((totalSales - prev) / prev) * 100).toFixed(2)} %` : null };
  });
  return { success: true, message: "Yearly sales growth rate data fetched from DB", yearlySalesGrowthRate };
}
