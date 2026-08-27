# Analytics API Contract (v2)

All endpoints are `GET`, return JSON `{ success: true, data: ... }` on success and
`{ success: false, message }` with a 4xx/5xx status on failure. All money values are numbers
(store currency, default INR — reported in `/api/meta`). Dates are ISO-8601 strings.

Common query params:
- `range` — `7d | 30d | 90d | 12m | ytd | all` (default `12m`). Filters orders by `created_at`.
- `interval` — `daily | weekly | monthly | quarterly | yearly` (default `monthly`).
- `page` (1-based), `limit` (default 20, max 100), `search`, `sort` (`field:asc|desc`).

## Meta / health
- `GET /api/health` → `{ status: "ok", source: "mongodb" | "demo", uptime, ordersLoaded, lastRefresh }`
- `GET /api/meta` → `{ currency, storeName, dateRange: { min, max }, counts: { orders, customers, products } }`

## Summary (KPI header)
- `GET /api/summary?range=` →
```
{
  range, from, to, previousFrom, previousTo,
  kpis: {
    revenue:        { value, previous, delta, deltaPct, spark: [n...] },
    orders:         { ... }, customers: { ... }, newCustomers: { ... },
    aov:            { ... }, unitsSold: { ... }, repeatRate: { ... }  // repeatRate value is 0..1
    refundRate:     { ... }                                            // 0..1, derived from financial_status
  }
}
```

## Sales
- `GET /api/sales/timeseries?interval=&range=` → `[{ period, label, revenue, orders, units, aov, newCustomers }]`
  - `period` sortable key (`2024-03`, `2024-Q1`, `2024-W12`, `2024-03-14`, `2024`), `label` human-friendly.
- `GET /api/sales/growth?interval=monthly|quarterly|yearly` → `[{ period, label, revenue, previousRevenue, growthRate }]` (`growthRate` percent number or null)
- `GET /api/sales/heatmap?range=` → `[{ dow: 0-6, hour: 0-23, orders, revenue }]` (168 cells, all present)
- `GET /api/sales/forecast?months=6` → `{ history: [{ period, revenue }], forecast: [{ period, revenue, lower, upper }] }` (Holt linear trend + seasonal naive; document method)
- `GET /api/sales/channels?range=` → `[{ channel, revenue, orders, share }]` (from `source_name`, default "web")
- `GET /api/sales/categories?range=` → `[{ category, revenue, units, orders, share }]` (from product `product_type`, fallback vendor, fallback "Uncategorized")

## Orders
- `GET /api/orders?page&limit&search&status&sort&range` → `{ rows: [...], total, page, limit, pages }`
  - row: `{ id, orderNumber, createdAt, customer: { id, name, email }, itemCount, total, currency, financialStatus, fulfillmentStatus, channel, city, country }`
- `GET /api/orders/recent?limit=12` → latest orders (same row shape) — used for the "live feed"
- `GET /api/orders/status?range=` → `{ financial: [{ status, count, revenue }], fulfillment: [{ status, count }] , funnel: [{ stage, count }] }`
  - funnel stages in order: `placed → paid → fulfilled → delivered` (delivered simulated from fulfillment_status + age if not available)
- `GET /api/orders/:id` → full order detail `{ ...row, lineItems: [{ productId, name, sku, quantity, price, total }], subtotal, discount, shipping, tax, total, address }`

## Products
- `GET /api/products?page&limit&search&sort&range` → `{ rows, total, page, limit, pages }`
  - row: `{ id, title, category, vendor, price, stock, revenue, units, orders, trend: [n x 8], status: "healthy"|"low"|"out" }`
- `GET /api/products/top?limit=10&by=units|revenue&range=` → rows as above
- `GET /api/products/inventory` → `{ total, healthy, low, out, value, alerts: [{ id, title, stock, velocityPerWeek, daysLeft }] }`

## Customers
- `GET /api/customers?page&limit&search&sort` → `{ rows, total, page, limit, pages }`
  - row: `{ id, name, email, createdAt, city, country, orders, totalSpent, aov, lastOrderAt, segment }`
- `GET /api/customers/top?limit=10` → rows sorted by totalSpent
- `GET /api/customers/new?interval=&range=` → `[{ period, label, count, cumulative }]`
- `GET /api/customers/repeat?interval=&range=` → `[{ period, label, repeatCustomers, totalCustomers, repeatRate }]`
  - repeat customer in a period = customer with ≥2 orders whose order falls in that period (matches original README semantics) — also expose `repeatRate` = repeatCustomers / totalCustomers (0..1)
- `GET /api/customers/cohorts?months=12` → `[{ cohort, label, customers, revenue, ltv, retention: [pct m0..mN] }]`
  - cohort = month of first purchase; `retention[k]` = % of cohort customers who ordered in month k after first purchase (m0 = 100)
- `GET /api/customers/geo` → `[{ city, country, countryCode, lat, lng, customers, revenue, orders }]` — lat/lng from bundled city table, then optional OpenCage lookup (server-side, cached), unknown cities omitted from output but counted in `unknown`
  - actual response: `{ points: [...], unknown: n }`
- `GET /api/customers/rfm` → `{ segments: [{ segment, count, revenue, share, description }], scatter: [{ recency, frequency, monetary, segment }] }`
  - segments: Champions, Loyal, Potential Loyalist, New, Promising, Need Attention, About To Sleep, At Risk, Hibernating, Lost

## Insights
- `GET /api/insights?range=` → `[{ id, type: "positive"|"negative"|"neutral"|"alert", title, body, metric, value, delta, href }]`
  - derived automatically: revenue vs previous period, best-selling product momentum, biggest city, stockouts, unusual days (z-score > 2), AOV shift, repeat-rate change.

## Legacy compatibility (kept so old links keep working)
- `/api/customers/getCustomerCount`, `/api/customers/newCustomersAdded`, `/api/customers/getRepeatCustomers`,
  `/api/customers/clvByCohorts`, `/api/customers/geographicalDistribution`,
  `/api/orders/getTotalOrderCount`, `/api/products/getTotalProducts`, `/api/products/getTop10Products`,
  `/api/sales/getTotalSalesAmount`, `/api/sales/getSalesData`, `/api/sales/yearlyGrowthRate`
  — keep their original response shapes.
