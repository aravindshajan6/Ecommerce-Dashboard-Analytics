/**
 * Singleton in-memory data store.
 *
 * `init()` loads either
 *   - the three Shopify collections from MongoDB (MONGODB_URI set, connection within 8s), refreshed
 *     every REFRESH_MINUTES, or
 *   - the deterministic demo dataset (generator.js)
 * and normalizes them into compact records + indexes that the analytics layer consumes.
 */
import mongoose from "mongoose";
import { generateDataset } from "./generator.js";
import { findCity } from "./cities.js";

const COLLECTIONS = { orders: "shopifyOrders", customers: "shopifyCustomers", products: "shopifyProducts" };

let state = null;
let refreshTimer = null;
const listeners = new Set();

// ---------- parsing helpers (defensive: real exports are messy) ----------
export function toNumber(v) {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "object" && v.$numberDecimal != null) return toNumber(v.$numberDecimal);
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function parseDate(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "object" && v.$date != null) return parseDate(v.$date);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const str = (v) => (v == null ? null : String(v));
const clean = (v) => {
  const s = str(v);
  return s && s.trim() ? s.trim() : null;
};
const coord = (v) => {
  const n = v == null || v === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

function fullName(first, last, fallback) {
  const n = [clean(first), clean(last)].filter(Boolean).join(" ");
  return n || fallback || null;
}

// ---------- normalization ----------
export function normalizeProducts(rawProducts = []) {
  const out = [];
  for (const p of rawProducts) {
    if (!p) continue;
    const id = str(p.id ?? p._id);
    if (!id) continue;
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const prices = variants.map((v) => toNumber(v?.price)).filter((n) => n > 0);
    const price = prices.length ? Math.min(...prices) : toNumber(p.price);
    const stock = variants.length ? variants.reduce((s, v) => s + toNumber(v?.inventory_quantity), 0) : toNumber(p.inventory_quantity);
    out.push({
      id,
      title: clean(p.title) ?? `Product ${id}`,
      category: clean(p.product_type) ?? clean(p.vendor) ?? "Uncategorized",
      vendor: clean(p.vendor) ?? "Unknown",
      price,
      stock,
      sku: clean(variants[0]?.sku),
      createdAt: parseDate(p.created_at),
    });
  }
  return out;
}

export function normalizeCustomers(rawCustomers = []) {
  const out = [];
  for (const c of rawCustomers) {
    if (!c) continue;
    const id = str(c.id ?? c._id);
    if (!id) continue;
    const createdAt = parseDate(c.created_at) ?? parseDate(c.updated_at);
    const addr = c.default_address ?? c.addresses?.[0] ?? {};
    const city = clean(addr.city);
    const known = city ? findCity(city) : null;
    out.push({
      id,
      name: fullName(c.first_name, c.last_name, clean(c.email) ?? `Customer ${id}`),
      email: clean(c.email),
      createdAt,
      ts: createdAt ? createdAt.getTime() : null,
      city: known?.city ?? city,
      country: clean(addr.country) ?? known?.country ?? null,
      lat: coord(addr.latitude) ?? known?.lat ?? null,
      lng: coord(addr.longitude) ?? known?.lng ?? null,
    });
  }
  return out;
}

export function normalizeOrders(rawOrders = [], customerById = new Map()) {
  const out = [];
  for (const o of rawOrders) {
    if (!o) continue;
    const createdAt = parseDate(o.created_at) ?? parseDate(o.processed_at);
    if (!createdAt) continue; // unparsable date: cannot place on a timeline
    const id = str(o.id ?? o._id);
    if (!id) continue;
    const customerId = str(o.customer?.id ?? o.customer_id) ?? null;
    const known = customerId ? customerById.get(customerId) : null;
    const lineItems = (Array.isArray(o.line_items) ? o.line_items : []).map((li) => ({
      productId: str(li?.product_id),
      name: clean(li?.name) ?? clean(li?.title) ?? "Item",
      sku: clean(li?.sku),
      quantity: Math.max(0, Math.round(toNumber(li?.quantity))) || 0,
      price: toNumber(li?.price),
    }));
    const units = lineItems.reduce((s, li) => s + li.quantity, 0);
    const total = toNumber(o.total_price_set?.shop_money?.amount ?? o.total_price ?? o.current_total_price);
    const addr = o.shipping_address ?? o.billing_address ?? {};
    const city = clean(addr.city) ?? known?.city ?? null;
    const knownCity = city ? findCity(city) : null;
    out.push({
      id,
      orderNumber: o.order_number ?? clean(o.name) ?? id,
      createdAt,
      ts: createdAt.getTime(),
      customerId,
      customerName: fullName(o.customer?.first_name, o.customer?.last_name, known?.name ?? clean(o.email) ?? "Guest"),
      customerEmail: clean(o.customer?.email) ?? clean(o.email) ?? known?.email ?? null,
      total,
      subtotal: toNumber(o.subtotal_price ?? o.subtotal_price_set?.shop_money?.amount),
      discount: toNumber(o.total_discounts ?? o.total_discounts_set?.shop_money?.amount),
      tax: toNumber(o.total_tax ?? o.total_tax_set?.shop_money?.amount),
      shipping: toNumber(o.total_shipping_price_set?.shop_money?.amount),
      units,
      lineItems,
      financialStatus: clean(o.financial_status)?.toLowerCase() ?? "paid",
      fulfillmentStatus: clean(o.fulfillment_status)?.toLowerCase() ?? null,
      channel: clean(o.source_name)?.toLowerCase() ?? "web",
      city: knownCity?.city ?? city,
      country: clean(addr.country) ?? knownCity?.country ?? known?.country ?? null,
      lat: coord(addr.latitude) ?? knownCity?.lat ?? known?.lat ?? null,
      lng: coord(addr.longitude) ?? knownCity?.lng ?? known?.lng ?? null,
      currency: clean(o.currency) ?? clean(o.total_price_set?.shop_money?.currency_code) ?? null,
    });
  }
  out.sort((a, b) => a.ts - b.ts);
  return out;
}

/** Build the full normalized state (+ indexes) from raw Shopify-shaped docs. */
export function buildState({ orders = [], customers = [], products = [] }, source = "demo", now = Date.now()) {
  const normProducts = normalizeProducts(products);
  const productById = new Map(normProducts.map((p) => [p.id, p]));

  const normCustomers = normalizeCustomers(customers);
  const customerById = new Map(normCustomers.map((c) => [c.id, c]));

  const normOrders = normalizeOrders(orders, customerById);

  // customers referenced by orders but missing from the customers collection => synthesize
  const ordersByCustomer = new Map();
  const customerStats = new Map();
  for (const o of normOrders) {
    if (!o.customerId) continue;
    if (!customerById.has(o.customerId)) {
      const synthetic = {
        id: o.customerId,
        name: o.customerName ?? `Customer ${o.customerId}`,
        email: o.customerEmail,
        createdAt: o.createdAt,
        ts: o.ts,
        city: o.city,
        country: o.country,
        lat: o.lat,
        lng: o.lng,
        synthetic: true,
      };
      customerById.set(o.customerId, synthetic);
      normCustomers.push(synthetic);
    }
    let list = ordersByCustomer.get(o.customerId);
    if (!list) ordersByCustomer.set(o.customerId, (list = []));
    list.push(o);
    let s = customerStats.get(o.customerId);
    if (!s) customerStats.set(o.customerId, (s = { orders: 0, revenue: 0, units: 0, firstTs: o.ts, lastTs: o.ts }));
    s.orders += 1;
    s.revenue += o.total;
    s.units += o.units;
    if (o.ts < s.firstTs) s.firstTs = o.ts;
    if (o.ts > s.lastTs) s.lastTs = o.ts;
  }
  // customers without a created date inherit their first order date
  for (const c of normCustomers) {
    if (!c.ts) {
      const s = customerStats.get(c.id);
      if (s) {
        c.ts = s.firstTs;
        c.createdAt = new Date(s.firstTs);
      }
    }
  }

  const currency = normOrders.find((o) => o.currency)?.currency ?? "INR";
  let earliestTs = normOrders.length ? normOrders[0].ts : Infinity;
  for (const c of normCustomers) if (c.ts != null && c.ts < earliestTs) earliestTs = c.ts;
  return {
    source,
    loadedAt: new Date(now),
    currency,
    orders: normOrders,
    customers: normCustomers,
    products: normProducts,
    indexes: {
      ordersByCustomer,
      productById,
      customerById,
      customerStats,
      minTs: normOrders.length ? normOrders[0].ts : null,
      maxTs: normOrders.length ? normOrders[normOrders.length - 1].ts : null,
      // earliest point in the dataset (orders or customer sign-ups) - lower bound for range=all
      earliestTs: earliestTs === Infinity ? null : earliestTs,
    },
  };
}

// ---------- sources ----------
export function buildDemoState({ seed = process.env.DEMO_SEED ?? 42, now = Date.now() } = {}) {
  const dataset = generateDataset({ seed: Number(seed) || 42, now });
  return buildState(dataset, "demo", now);
}

async function loadFromMongo(uri, timeoutMs = 8000) {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: timeoutMs,
    connectTimeoutMS: timeoutMs,
  });
  const db = conn.connection.db;
  const [orders, customers, products] = await Promise.all([
    db.collection(COLLECTIONS.orders).find({}).toArray(),
    db.collection(COLLECTIONS.customers).find({}).toArray(),
    db.collection(COLLECTIONS.products).find({}).toArray(),
  ]);
  return { orders, customers, products, host: conn.connection.host };
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function setState(next) {
  state = next;
  for (const fn of listeners) {
    try {
      fn(state);
    } catch (err) {
      console.error("[store] refresh listener failed:", err.message);
    }
  }
}

export async function refresh() {
  if (!state || state.source !== "mongodb") return state;
  try {
    const raw = await loadFromMongo(process.env.MONGODB_URI);
    setState(buildState(raw, "mongodb"));
    console.log(`[store] refreshed from MongoDB: ${state.orders.length} orders, ${state.customers.length} customers, ${state.products.length} products`);
  } catch (err) {
    console.warn(`[store] refresh failed, keeping previous snapshot: ${err.message}`);
  }
  return state;
}

/**
 * Initialise the store. Resolves once data is available.
 * Options: { uri, seed, now, refreshMinutes, timeoutMs }
 */
export async function init({
  uri = process.env.MONGODB_URI,
  seed = process.env.DEMO_SEED ?? 42,
  now = Date.now(),
  refreshMinutes = Number(process.env.REFRESH_MINUTES) || 10,
  timeoutMs = 8000,
} = {}) {
  if (refreshTimer) clearInterval(refreshTimer);
  if (uri && uri.trim()) {
    try {
      const raw = await withTimeout(loadFromMongo(uri.trim(), timeoutMs), timeoutMs + 2000, `MongoDB did not respond within ${timeoutMs}ms`);
      setState(buildState(raw, "mongodb", now));
      console.log(`[store] loaded from MongoDB (${raw.host}): ${state.orders.length} orders, ${state.customers.length} customers, ${state.products.length} products`);
      refreshTimer = setInterval(refresh, Math.max(1, refreshMinutes) * 60_000);
      refreshTimer.unref?.();
      return state;
    } catch (err) {
      console.warn(`[store] WARNING: MongoDB unavailable (${err.message}) - falling back to demo dataset`);
      mongoose.disconnect().catch(() => {});
    }
  } else {
    console.warn("[store] WARNING: MONGODB_URI not set - running in demo mode with generated data");
  }
  setState(buildDemoState({ seed, now }));
  console.log(`[store] demo dataset ready (seed ${seed}): ${state.orders.length} orders, ${state.customers.length} customers, ${state.products.length} products`);
  return state;
}

export function getState() {
  if (!state) throw new Error("Data store not initialised - call init() first");
  return state;
}

export function isReady() {
  return state != null;
}

/** Subscribe to refreshes (used to clear the response cache). Returns unsubscribe fn. */
export function onRefresh(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function close() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = null;
  if (state?.source === "mongodb") await mongoose.disconnect().catch(() => {});
}
