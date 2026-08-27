import { getState } from "../data/store.js";

export function health(req, res) {
  const s = getState();
  res.json({
    success: true,
    data: {
      status: "ok",
      source: s.source,
      uptime: Math.round(process.uptime()),
      ordersLoaded: s.orders.length,
      lastRefresh: s.loadedAt.toISOString(),
    },
  });
}

export function meta(req, res) {
  const s = getState();
  res.json({
    success: true,
    data: {
      currency: s.currency,
      storeName: process.env.STORE_NAME || "RQ Analytics Demo Store",
      source: s.source,
      dateRange: {
        min: s.indexes.minTs ? new Date(s.indexes.minTs).toISOString() : null,
        max: s.indexes.maxTs ? new Date(s.indexes.maxTs).toISOString() : null,
      },
      counts: { orders: s.orders.length, customers: s.customers.length, products: s.products.length },
    },
  });
}
