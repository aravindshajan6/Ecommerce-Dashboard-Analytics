# Modernization Plan — Nova Commerce

## 1. Where we started
- **Backend**: Express + Mongoose, 11 endpoints that ran raw Mongo aggregations for six README charts. No fallback without a database, inconsistent error handling, static path bug (`frontend/build` vs `frontend/dist`), open CORS.
- **Frontend**: React 18 + Vite 5 + Tailwind 3 + Chart.js + Leaflet. Four bare pages (Hero, Overview, Sales, Customers), default Chart.js styling, per-city client-side geocoding (an API key per visitor), no loading/error states, bugs (undefined `setLoading`, `o.5` alpha typo).

## 2. Research takeaways (see docs/DESIGN.md for the full brief)
- Best-in-class e-com analytics (Shopify Analytics, Triple Whale, Polar, Peel, Lifetimely) converge on: KPI row with deltas + sparklines, period comparison, cohort LTV/retention matrix, RFM segments, repeat rate, product performance, order funnel, live order feed / globe, auto-insights & anomalies, forecasting, ⌘K, dark mode, CSV export.
- 2025–26 visual language: dark-first glassmorphism over aurora gradients, bento grids, spotlight cards, animated gradient borders, tabular-num animated counters, 3D only where it carries meaning.

## 3. Target architecture
```
root package.json  → npm run dev (API + web), npm run build, npm start (Render-compatible)
backend/           → Express 4 (ESM) · src/data (Mongo loader | deterministic demo generator | city table)
                     · src/analytics (pure functions: summary, sales, orders, products, customers, insights)
                     · src/routes (v2 API + legacy compat) · node --test suite · scripts/seed.js
frontend/          → Vite 6 · React 19 · Tailwind 3.4 tokens (light/dark) · TanStack Query
                     · Recharts 3 (themed) · react-three-fiber 9 + drei 10 (Globe, HeroScene, DataCore,
                       CohortBars, ProductPodium, AuroraParticles) · anime.js v4 (counters, timelines,
                       staggers, SVG draw) · react-leaflet 5 (2D map) · ⌘K palette
docs/              → API.md (contract), DESIGN.md (system), LIBRARY_NOTES.md, PLAN.md
```

## 4. Feature set delivered
| Area | Features |
|---|---|
| Overview | 8 KPIs w/ deltas + sparklines, revenue/orders chart, auto-insights, live order feed, channel mix, top products, category treemap, top customers, 3D product podium, weekday×hour heatmap |
| Sales | Interval switch (day→year), moving average, growth-rate chart, Holt forecast w/ band, channels, categories, best day/hour/month |
| Orders | Status funnel, financial/fulfillment donuts, orders timeseries + AOV, searchable/sortable/paginated table with URL state, order drawer |
| Products | #1 spotlight, 3D top-3 podium, inventory health + stock-out alerts with days-left, category bars, product table with trends |
| Customers | New vs repeat, cohort retention matrix (2D heatmap ↔ 3D surface), LTV by cohort, RFM segment grid + scatter, leaderboard, customer table |
| Geography | 3D dot-matrix globe with arcs & pulsing cities, 2D dark map, city ranking, country donut |
| Platform | ⌘K command palette, global date range, light/dark, reduced-motion fallbacks, skeletons, CSV export, demo mode without a DB, Mongo seed script, legacy API compatibility |

## 5. Execution (parallel agents)
1. Research (features/UX; verified library APIs) → 2. Contract (docs/API.md) → 3. Foundation (tokens, shell, primitives, hooks)
→ 4. Parallel build: backend · 3D components · Overview+Sales · Orders+Products · Customers+Geography · Landing+Palette+Insights
→ 5. Integration: run API + web, Playwright screenshots of every route in both themes, fix console errors, lint, build
→ 6. Docs + deploy notes.

## 6. Out of scope / honest limits
- Conversion rate, CAC and sessions need traffic data that the Shopify collections don't contain — not shown (no fake metrics).
- "Live" feed replays the newest orders from the dataset (polling), not a websocket stream.
- Forecast is a simple Holt linear-trend projection; treat as directional.
