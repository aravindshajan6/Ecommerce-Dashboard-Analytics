/**
 * Orders: paginated list, live feed, status breakdown + funnel, detail.
 */
import { resolveRange, sliceByTs, paginate, round2, DAY, ApiError } from "./util.js";

export function toRow(state, o) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt.toISOString(),
    customer: { id: o.customerId, name: o.customerName, email: o.customerEmail },
    itemCount: o.units,
    total: round2(o.total),
    currency: o.currency ?? state.currency,
    financialStatus: o.financialStatus,
    fulfillmentStatus: o.fulfillmentStatus,
    channel: o.channel,
    city: o.city,
    country: o.country,
  };
}

export function listOrders(state, { page, limit, search, status, sort, range = "all", now = Date.now() } = {}) {
  const r = resolveRange(range, now, state.indexes.earliestTs);
  let orders = sliceByTs(state.orders, r.from, r.to);
  if (status && String(status).trim()) {
    const s = String(status).trim().toLowerCase();
    orders = orders.filter((o) => o.financialStatus === s || (o.fulfillmentStatus ?? "unfulfilled") === s);
  }
  const rows = orders.map((o) => toRow(state, o));
  return paginate(rows, {
    page,
    limit,
    search,
    sort,
    defaultSort: "createdAt:desc",
    searchFields: ["orderNumber", "customer.name", "customer.email", "city", "country", "financialStatus", "channel"],
  });
}

export function recentOrders(state, { limit = 12 } = {}) {
  const n = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const out = [];
  for (let i = state.orders.length - 1; i >= 0 && out.length < n; i--) out.push(toRow(state, state.orders[i]));
  return out;
}

export function orderStatus(state, { range = "12m", now = Date.now() } = {}) {
  const r = resolveRange(range, now, state.indexes.earliestTs);
  const orders = sliceByTs(state.orders, r.from, r.to);
  const fin = new Map();
  const ful = new Map();
  let paid = 0;
  let fulfilled = 0;
  let delivered = 0;
  const nowTs = new Date(now).getTime();
  for (const o of orders) {
    const f = fin.get(o.financialStatus) ?? { status: o.financialStatus, count: 0, revenue: 0 };
    f.count += 1;
    f.revenue += o.total;
    fin.set(o.financialStatus, f);
    const fs = o.fulfillmentStatus ?? "unfulfilled";
    ful.set(fs, (ful.get(fs) ?? 0) + 1);
    const isPaid = o.financialStatus === "paid" || o.financialStatus === "refunded" || o.financialStatus === "partially_refunded" || o.financialStatus === "partially_paid";
    if (isPaid) paid++;
    if (isPaid && o.fulfillmentStatus === "fulfilled") {
      fulfilled++;
      // delivered is not in the Shopify order document: simulate as fulfilled orders older than 5 days
      if (o.delivered === true || nowTs - o.ts > 5 * DAY) delivered++;
    }
  }
  return {
    financial: [...fin.values()].sort((a, b) => b.count - a.count).map((f) => ({ ...f, revenue: round2(f.revenue) })),
    fulfillment: [...ful.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    funnel: [
      { stage: "placed", count: orders.length },
      { stage: "paid", count: paid },
      { stage: "fulfilled", count: fulfilled },
      { stage: "delivered", count: delivered },
    ],
  };
}

export function orderDetail(state, id) {
  const key = String(id ?? "").trim();
  const numeric = key.replace(/^#/, "");
  const o = state.orders.find((x) => x.id === key || String(x.orderNumber) === numeric || String(x.orderNumber) === key);
  if (!o) throw new ApiError(404, `Order ${key} not found`);
  return {
    ...toRow(state, o),
    lineItems: o.lineItems.map((li) => {
      const p = li.productId ? state.indexes.productById.get(li.productId) : null;
      return {
        productId: li.productId,
        name: li.name,
        sku: li.sku ?? p?.sku ?? null,
        category: p?.category ?? "Uncategorized",
        quantity: li.quantity,
        price: round2(li.price),
        total: round2(li.price * li.quantity),
      };
    }),
    subtotal: round2(o.subtotal || o.lineItems.reduce((s, li) => s + li.price * li.quantity, 0)),
    discount: round2(o.discount),
    shipping: round2(o.shipping),
    tax: round2(o.tax),
    total: round2(o.total),
    address: { city: o.city, country: o.country, lat: o.lat, lng: o.lng },
  };
}
