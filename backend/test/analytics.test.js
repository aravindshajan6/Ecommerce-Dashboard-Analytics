import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateDataset } from "../src/data/generator.js";
import { buildDemoState, buildState } from "../src/data/store.js";
import { findCity } from "../src/data/cities.js";
import { resolveRange, bucketKey, bucketLabel, fillMissingBuckets, paginate, ApiError } from "../src/analytics/util.js";
import { getSummary } from "../src/analytics/summary.js";
import { getTimeseries, getGrowth, getHeatmap, getForecast, getChannels, getCategories } from "../src/analytics/sales.js";
import { listOrders, recentOrders, orderStatus, orderDetail } from "../src/analytics/orders.js";
import { listProducts, topProducts, inventory } from "../src/analytics/products.js";
import { listCustomers, newCustomers, repeatCustomers, cohorts, geo, getRfm } from "../src/analytics/customers.js";
import { getInsights } from "../src/analytics/insights.js";
import * as legacy from "../src/analytics/legacy.js";

const NOW = Date.UTC(2026, 7, 27, 12, 0, 0);
const state = buildDemoState({ seed: 42, now: NOW });
const sumTotals = (orders) => Math.round(orders.reduce((s, o) => s + o.total, 0) * 100) / 100;

describe("generator", () => {
  test("is deterministic for the same seed and now", () => {
    const a = generateDataset({ seed: 7, now: NOW });
    const b = generateDataset({ seed: 7, now: NOW });
    assert.equal(a.orders.length, b.orders.length);
    assert.equal(a.customers.length, b.customers.length);
    const total = (d) => d.orders.reduce((s, o) => s + Number(o.total_price), 0).toFixed(2);
    assert.equal(total(a), total(b));
    assert.deepEqual(a.orders[100], b.orders[100]);
    const c = generateDataset({ seed: 8, now: NOW });
    assert.notEqual(total(a), total(c));
  });

  test("produces realistic volumes and shapes", () => {
    assert.ok(state.orders.length > 7000 && state.orders.length < 11000, `orders ${state.orders.length}`);
    assert.ok(state.customers.length > 1200 && state.customers.length < 2000, `customers ${state.customers.length}`);
    assert.equal(state.products.length, 60);
    assert.equal(state.products.filter((p) => p.stock <= 0).length, 3);
    assert.equal(state.products.filter((p) => p.stock > 0 && p.stock <= 10).length, 6);
    const repeaters = [...state.indexes.customerStats.values()].filter((s) => s.orders > 1).length;
    const share = repeaters / state.indexes.customerStats.size;
    assert.ok(share > 0.25 && share < 0.45, `repeat share ${share}`);
    for (let i = 1; i < state.orders.length; i++) assert.ok(state.orders[i].ts >= state.orders[i - 1].ts);
  });
});

describe("store normalization", () => {
  test("handles messy documents defensively", () => {
    const s = buildState(
      {
        products: [{ id: 1, title: "X", variants: [{ price: "10.00", inventory_quantity: "5" }] }, null, { title: "no id" }],
        customers: [{ id: 9, first_name: "A", default_address: { city: "bangalore" } }],
        orders: [
          { id: 1, created_at: "not a date", total_price_set: { shop_money: { amount: "10" } } },
          { id: 2, created_at: "2024-01-05T10:00:00Z", customer_id: 9, total_price_set: { shop_money: { amount: "₹1,250.50" } }, line_items: [{ product_id: 1, quantity: "2", price: "10" }] },
          { id: 3, created_at: "2024-02-05T10:00:00Z", customer: { id: 77, first_name: "Ghost" }, total_price: "99" },
        ],
      },
      "demo",
      NOW,
    );
    assert.equal(s.orders.length, 2);
    assert.equal(s.orders[0].total, 1250.5);
    assert.equal(s.orders[0].units, 2);
    assert.equal(s.orders[0].city, "Bengaluru");
    assert.equal(s.customers.length, 2);
    assert.ok(s.indexes.customerById.get("77").synthetic);
    assert.equal(s.products.length, 1);
    assert.equal(findCity("NYC").city, "New York");
  });
});

describe("util", () => {
  test("resolveRange rejects invalid ranges and builds equal previous periods", () => {
    assert.throws(() => resolveRange("2w", NOW), ApiError);
    const r = resolveRange("30d", NOW);
    assert.equal(r.to.getTime() - r.from.getTime(), r.previousTo.getTime() - r.previousFrom.getTime());
    assert.equal(r.previousTo.getTime(), r.from.getTime());
    assert.equal(resolveRange("all", NOW, 5).from.getTime(), 5);
  });

  test("bucket keys and labels", () => {
    const d = new Date(Date.UTC(2024, 2, 14));
    assert.equal(bucketKey(d, "daily"), "2024-03-14");
    assert.equal(bucketKey(d, "weekly"), "2024-W11");
    assert.equal(bucketKey(d, "monthly"), "2024-03");
    assert.equal(bucketKey(d, "quarterly"), "2024-Q1");
    assert.equal(bucketKey(d, "yearly"), "2024");
    assert.equal(bucketLabel("2024-W12", "weekly"), "W12 '24");
    assert.equal(bucketLabel("2024-03", "monthly"), "Mar 2024");
    assert.equal(bucketLabel("2024-Q1", "quarterly"), "Q1 2024");
    const weeks = fillMissingBuckets(new Map(), "weekly", Date.UTC(2023, 11, 20), Date.UTC(2024, 0, 20));
    assert.deepEqual(weeks.map((w) => w.period), ["2023-W51", "2023-W52", "2024-W01", "2024-W02", "2024-W03"]);
  });

  test("paginate: search, sort, bounds", () => {
    const rows = Array.from({ length: 23 }, (_, i) => ({ id: i, name: i % 2 ? `alpha${i}` : `beta${i}` }));
    const p = paginate(rows, { page: 2, limit: 5, search: "alpha", sort: "id:desc", searchFields: ["name"] });
    assert.equal(p.total, 11);
    assert.equal(p.pages, 3);
    assert.equal(p.rows.length, 5);
    assert.ok(p.rows.every((r) => r.name.startsWith("alpha")));
    assert.ok(p.rows[0].id > p.rows[1].id);
    assert.equal(paginate(rows, { limit: 500 }).limit, 100);
  });
});

describe("summary", () => {
  test("deltas are consistent with previous period", () => {
    const s = getSummary(state, { range: "30d", now: NOW });
    assert.equal(s.range, "30d");
    for (const [key, k] of Object.entries(s.kpis)) {
      assert.equal(k.spark.length, 12, key);
      assert.ok(Math.abs(k.delta - (k.value - k.previous)) < 0.011, `${key} delta`);
      if (k.previous) assert.ok(Math.abs(k.deltaPct - ((k.value - k.previous) / k.previous) * 100) < 0.011, `${key} deltaPct`);
    }
    assert.ok(s.kpis.revenue.value > 0);
    assert.ok(s.kpis.repeatRate.value >= 0 && s.kpis.repeatRate.value <= 1);
    assert.ok(s.kpis.refundRate.value >= 0 && s.kpis.refundRate.value <= 1);
    const all = getSummary(state, { range: "all", now: NOW });
    assert.equal(all.kpis.orders.value, state.orders.length);
    assert.equal(all.kpis.revenue.previous, null);
  });
});

describe("sales", () => {
  test("timeseries buckets are continuous and totals equal the sum of orders", () => {
    for (const interval of ["daily", "weekly", "monthly", "quarterly", "yearly"]) {
      const rows = getTimeseries(state, { interval, range: "all", now: NOW });
      assert.ok(rows.length > 1, interval);
      assert.equal(rows.reduce((s, r) => s + r.orders, 0), state.orders.length, `${interval} orders`);
      assert.ok(Math.abs(rows.reduce((s, r) => s + r.revenue, 0) - sumTotals(state.orders)) < 1, `${interval} revenue`);
      const keys = rows.map((r) => r.period);
      assert.deepEqual(keys, [...keys].sort(), `${interval} sorted`);
      assert.equal(new Set(keys).size, keys.length, `${interval} unique`);
    }
    const monthly = getTimeseries(state, { interval: "monthly", range: "all", now: NOW });
    const nextMonth = (k) => {
      const [y, m] = k.split("-").map(Number);
      return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    };
    for (let i = 1; i < monthly.length; i++) assert.equal(monthly[i].period, nextMonth(monthly[i - 1].period));
    const newC = monthly.reduce((s, r) => s + r.newCustomers, 0);
    assert.equal(newC, state.customers.length);
    const r30 = getTimeseries(state, { interval: "daily", range: "30d", now: NOW });
    assert.ok(r30.length >= 30 && r30.length <= 32, `30d daily ${r30.length}`);
  });

  test("timeseries shows seasonality and growth", () => {
    const rows = getTimeseries(state, { interval: "yearly", range: "all", now: NOW });
    const y2023 = rows.find((r) => r.period === "2023").revenue;
    const y2025 = rows.find((r) => r.period === "2025").revenue;
    assert.ok(y2025 > y2023 * 1.3, "growth");
    const monthly = getTimeseries(state, { interval: "monthly", range: "all", now: NOW });
    const dec = monthly.find((r) => r.period === "2024-12").revenue;
    const feb = monthly.find((r) => r.period === "2025-02").revenue;
    assert.ok(dec > feb * 1.5, "seasonality");
  });

  test("growth, heatmap, channels, categories", () => {
    const g = getGrowth(state, { interval: "quarterly" });
    assert.equal(g[0].growthRate, null);
    assert.ok(g.length > 10);
    assert.throws(() => getGrowth(state, { interval: "daily" }), ApiError);
    const h = getHeatmap(state, { range: "90d", now: NOW });
    assert.equal(h.length, 168);
    const ch = getChannels(state, { range: "12m", now: NOW });
    assert.ok(Math.abs(ch.reduce((s, c) => s + c.share, 0) - 1) < 0.02);
    assert.equal(ch[0].channel, "web");
    const cat = getCategories(state, { range: "12m", now: NOW });
    assert.ok(cat.length >= 8);
  });

  test("forecast returns the requested number of months after the last complete month", () => {
    const f = getForecast(state, { months: 6, now: NOW });
    assert.equal(f.forecast.length, 6);
    assert.equal(f.forecast[0].period, "2026-08");
    assert.equal(f.forecast[5].period, "2027-01");
    assert.equal(f.history[f.history.length - 1].period, "2026-07");
    for (const p of f.forecast) assert.ok(p.lower <= p.revenue && p.revenue <= p.upper);
    assert.equal(getForecast(state, { months: 3, now: NOW }).forecast.length, 3);
  });
});

describe("orders", () => {
  test("pagination, search and detail", () => {
    const p1 = listOrders(state, { page: 1, limit: 5, range: "all" });
    const p2 = listOrders(state, { page: 2, limit: 5, range: "all" });
    assert.equal(p1.rows.length, 5);
    assert.equal(p1.total, state.orders.length);
    assert.notEqual(p1.rows[0].id, p2.rows[0].id);
    assert.ok(new Date(p1.rows[0].createdAt) > new Date(p1.rows[4].createdAt));
    const name = p1.rows[0].customer.name.split(" ")[0];
    const s = listOrders(state, { search: name, range: "all" });
    assert.ok(s.total > 0 && s.rows.every((r) => JSON.stringify(r).toLowerCase().includes(name.toLowerCase())));
    const st = listOrders(state, { status: "refunded", range: "all" });
    assert.ok(st.rows.every((r) => r.financialStatus === "refunded"));
    const recent = recentOrders(state, { limit: 3 });
    assert.equal(recent.length, 3);
    const d = orderDetail(state, recent[0].id);
    assert.ok(d.lineItems.length > 0);
    assert.ok(Math.abs(d.subtotal - d.discount + d.tax + d.shipping - d.total) < 0.05);
    assert.throws(() => orderDetail(state, "nope"), (e) => e.status === 404);
    const status = orderStatus(state, { range: "12m", now: NOW });
    assert.equal(status.funnel[0].stage, "placed");
    assert.ok(status.funnel[0].count >= status.funnel[1].count && status.funnel[1].count >= status.funnel[2].count && status.funnel[2].count >= status.funnel[3].count);
  });
});

describe("products", () => {
  test("list, top and inventory alerts", () => {
    const p = listProducts(state, { page: 1, limit: 10, range: "12m", now: NOW });
    assert.equal(p.total, 60);
    assert.equal(p.rows[0].trend.length, 8);
    assert.ok(p.rows[0].revenue >= p.rows[1].revenue);
    const top = topProducts(state, { limit: 5, by: "revenue", range: "90d", now: NOW });
    assert.equal(top.length, 5);
    assert.ok(top[0].revenue >= top[4].revenue);
    const inv = inventory(state, { now: NOW });
    assert.equal(inv.out, 3);
    assert.equal(inv.low, 6);
    assert.equal(inv.total, inv.healthy + inv.low + inv.out);
    assert.equal(inv.alerts.length, 9);
    assert.ok(inv.value > 0);
  });
});

describe("customers", () => {
  test("repeat customers semantics", () => {
    const rows = repeatCustomers(state, { interval: "monthly", range: "12m", now: NOW });
    const row = rows.find((r) => r.period === "2026-03");
    const inPeriod = state.orders.filter((o) => o.createdAt.toISOString().startsWith("2026-03"));
    const all = new Set(inPeriod.map((o) => o.customerId));
    const rep = new Set(inPeriod.filter((o) => state.indexes.customerStats.get(o.customerId).orders >= 2).map((o) => o.customerId));
    assert.equal(row.totalCustomers, all.size);
    assert.equal(row.repeatCustomers, rep.size);
    assert.ok(row.repeatRate > 0 && row.repeatRate <= 1);
    assert.ok(rows.every((r) => r.repeatCustomers <= r.totalCustomers));
  });

  test("new customers cumulative and cohorts", () => {
    const n = newCustomers(state, { interval: "monthly", range: "all", now: NOW });
    assert.equal(n[n.length - 1].cumulative, state.customers.length);
    for (let i = 1; i < n.length; i++) assert.equal(n[i].cumulative, n[i - 1].cumulative + n[i].count);
    const c = cohorts(state, { months: 12, now: NOW });
    assert.equal(c.length, 12);
    for (const row of c) {
      if (row.customers > 0) {
        assert.equal(row.retention[0], 100, row.cohort);
        assert.ok(Math.abs(row.ltv - row.revenue / row.customers) < 0.02);
      }
      assert.ok(row.retention.every((v) => v >= 0 && v <= 100));
    }
    assert.equal(c[0].retention.length, 12);
    assert.equal(c[11].retention.length, 1);
  });

  test("list/search, geo and rfm", async () => {
    const list = listCustomers(state, { page: 1, limit: 5, now: NOW });
    assert.equal(list.total, state.customers.length);
    assert.ok(list.rows[0].totalSpent >= list.rows[1].totalSpent);
    const search = listCustomers(state, { search: "mumbai", now: NOW });
    assert.ok(search.total > 0 && search.rows.every((r) => r.city === "Mumbai"));
    const g = await geo(state);
    assert.ok(g.points.length >= 30, `geo points ${g.points.length}`);
    assert.equal(g.unknown, 0);
    assert.ok(g.points.every((p) => typeof p.lat === "number" && typeof p.lng === "number"));
    const rfm = getRfm(state, { now: NOW });
    assert.equal(rfm.segments.length, 10);
    assert.equal(rfm.segments.reduce((s, x) => s + x.count, 0), state.indexes.customerStats.size);
    assert.ok(rfm.scatter.length > 100 && rfm.scatter.length <= 600);
    assert.ok(rfm.segments.every((s) => typeof s.description === "string" && s.description.length > 10));
  });
});

describe("insights + legacy", () => {
  test("insights produce 6-10 cards with hrefs", () => {
    const cards = getInsights(state, { range: "30d", now: NOW });
    assert.ok(cards.length >= 6 && cards.length <= 10, `cards ${cards.length}`);
    for (const c of cards) {
      assert.ok(["positive", "negative", "neutral", "alert"].includes(c.type));
      assert.ok(["/sales", "/products", "/customers", "/orders"].includes(c.href));
      assert.ok(c.title && c.body);
    }
  });

  test("legacy shapes", () => {
    assert.equal(legacy.totalOrderCount(state).totalOrders, state.orders.length);
    assert.equal(legacy.customerCount(state).customerCount, state.customers.length);
    assert.equal(legacy.totalProducts(state).totalProducts, 60);
    assert.equal(legacy.topProducts(state).topProducts.length, 8);
    assert.ok(legacy.salesData(state, { interval: "monthly" }).monthlySales.length > 30);
    assert.deepEqual(Object.keys(legacy.salesData(state, { interval: "quarterly" }).quarterlySales[0]._id), ["year", "quarter"]);
    assert.throws(() => legacy.salesData(state, { interval: "hourly" }), (e) => e.status === 400);
    const growth = legacy.yearlySalesGrowthRate(state).yearlySalesGrowthRate;
    assert.equal(growth[0].growthRate, null);
    assert.match(growth[1].growthRate, /%$/);
    assert.equal(Math.round(legacy.totalSalesAmount(state).totalSalesAmount), Math.round(sumTotals(state.orders)));
    assert.equal(legacy.clvByCohorts(state).clvByCohorts[0]._id, "2023-01");
    assert.ok(legacy.geographicalDistribution(state).geographicalData[0].customerCount > 0);
    assert.ok(legacy.newCustomersAdded(state, { interval: "yearly" }).newCustomers.length >= 4);
    assert.ok(legacy.repeatCustomers(state, { interval: "monthly" }).repeatCustomers.length > 30);
  });
});
