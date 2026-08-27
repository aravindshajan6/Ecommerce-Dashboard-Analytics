# Nova Commerce — E-commerce Analytics Platform

A futuristic analytics dashboard for a Shopify-style store: revenue intelligence, cohort retention, RFM segments, order funnel, inventory health, auto-generated insights, a live order feed and a 3D order globe.

**Stack:** React 19 · Vite 6 · Tailwind · TanStack Query · Recharts 3 · Three.js (react-three-fiber + drei) · anime.js v4 (DOM *and* 3D choreography) · Leaflet — Express 4 analytics API over MongoDB (or a built-in deterministic demo dataset).

Live: https://ecommerce-dashboard-a3ap.onrender.com/

## Quick start
```bash
npm run install:all      # installs backend + frontend deps
npm run dev              # API on :3010 (demo data) + Vite on :5173
```
Open http://localhost:5173. Without a `MONGODB_URI` the API serves a realistic generated dataset (≈9k orders, 1.5k customers, 60 products, 3 years of seasonality), so everything works out of the box.

### Use your MongoDB
```bash
cp backend/.env.example backend/.env   # set MONGODB_URI (RQ_Analytics: shopifyOrders / shopifyCustomers / shopifyProducts)
npm run seed                           # optional: load the demo dataset into MongoDB
npm run dev
```

## Run with Docker (recommended)

Only **one** port is published — the frontend. The API has no host port mapping at all and is
reachable only from inside the private compose network.

```bash
docker compose up -d --build     # then open http://localhost:8080
docker compose logs -f           # follow both services
docker compose down              # stop and remove
```

```
host :8080  ──►  web  (nginx:alpine)   serves the SPA, proxies /api ──►  api  (node:20-alpine)
                                                                          :3010, not published
```

| Service | Image | Published | Notes |
|---|---|---|---|
| `web` | `nova-commerce-web` (~98 MB) | `8080 → 80` | Multi-stage build; final image is nginx + static files, no Node |
| `api` | `nova-commerce-api` (~222 MB) | *none* | Runs as non-root `node`, `HEALTHCHECK` on `/api/health` |

`web` waits for `api` to report healthy before starting. Both restart automatically.

**Options** (all optional — it runs on the demo dataset out of the box):
```bash
WEB_PORT=3000 docker compose up -d                                  # publish on a different port
MONGODB_URI="mongodb+srv://…/RQ_Analytics" docker compose up -d     # use a real database
```
If `MONGODB_URI` is unreachable the API logs a warning and falls back to the demo dataset rather than crashing.

Nginx handles SPA deep links (`/geography`, `/orders/123`), gzip, immutable caching for hashed
assets, and resolves the API through Docker's embedded DNS so a redeployed API container is picked
up without an nginx reload.

### Production (single origin, e.g. Render)
```bash
npm run build   # builds frontend/dist
npm start       # Express serves the API and the SPA
```

## Docs
- [docs/API.md](docs/API.md) — API contract (v2 + legacy routes)
- [docs/DESIGN.md](docs/DESIGN.md) — design system & component map
- [docs/PLAN.md](docs/PLAN.md) — modernization plan and feature matrix
- [backend/README.md](backend/README.md) — data modes, env vars, tests (`npm test`)

## What's inside
| Page | Highlights |
|---|---|
| **Landing** `/` | 3D revenue-terrain hero (a 24×7 field of solid bars — one per hour × weekday — whose heights are real revenue from `/api/sales/heatmap`, with a scan wave, peak pins, radar rings and orbiting insight tiles), animated headline timeline, live stat ribbon, feature bento, a 4-step "how it works" pipeline with a self-drawing connector, an animated cohort-retention matrix, live auto-insights and an FAQ |
| **Overview** `/overview` | 8 KPIs with deltas + sparklines, revenue/orders chart, insights panel, live order feed, channel mix, category treemap, top customers, 3D product podium, weekday×hour heatmap |
| **Sales** `/sales` | Day→year intervals, moving average, growth chart, Holt forecast with confidence band, channels, categories, best day/hour/month |
| **Orders** `/orders` | Status funnel, financial/fulfillment donuts, orders + AOV timeseries, searchable/sortable/paginated table with URL state, slide-over order drawer |
| **Products** `/products` | #1 spotlight, 3D top-3 podium, inventory health with stockout days-left, category bars, product table with trend sparklines |
| **Customers** `/customers` | New vs repeat, cohort retention matrix (2D heatmap ↔ 3D surface), LTV by cohort, RFM segments + scatter, leaderboard, customer table |
| **Geography** `/geography` | 3D dot-matrix globe (revenue-coloured cities, arcs, pulsing rings), 2D dark map, city ranking, country donut |

Everywhere: ⌘K command palette, global date range, light/dark themes, skeleton loading states, CSV export,
`prefers-reduced-motion` fallbacks (WebGL scenes swap to static gradients), and a responsive layout down to 375px.

## Known limitations
- **No traffic data.** The Shopify collections contain orders, customers and products only, so conversion rate,
  CAC and cart abandonment are deliberately *not* shown rather than faked.
- **The "live" feed polls** the newest orders every 15s; it is not a websocket stream.
- **The forecast is a Holt linear-trend projection** on a seasonally-adjusted monthly series — directional, not a promise.
- The 2D map uses OpenStreetMap tiles (no API key); a commercial tile provider would need one.

## Original assignment (kept for reference)
Visualize a sample Shopify store (MongoDB `RQ_Analytics`): total sales over time (daily/monthly/quarterly/yearly), sales growth rate, new customers, repeat customers, geographic distribution, and customer lifetime value by cohort. All six are implemented (Sales, Customers and Geography pages) alongside the new features.
