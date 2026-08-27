# Analytics backend

Express 4 (ESM, Node 20) API for the e-commerce dashboard. All analytics run over an in-memory,
normalized snapshot of Shopify-shaped data, so every endpoint answers in milliseconds.

## Modes

| Mode | When | Notes |
| --- | --- | --- |
| **demo** | `MONGODB_URI` empty, or MongoDB does not answer within 8s | Deterministic generated dataset (~9k orders, ~1.5k customers, 60 products, 2023 to today). Seed via `DEMO_SEED`. |
| **mongodb** | `MONGODB_URI` set and reachable | Loads `shopifyOrders`, `shopifyCustomers`, `shopifyProducts`, refreshes every `REFRESH_MINUTES`. |

`GET /api/health` reports which source is active.

## Setup

```bash
cd backend
cp .env.example .env      # edit as needed
npm install
npm run dev               # nodemon, http://localhost:3010
npm start                 # production
npm test                  # node --test
npm run seed              # write the demo dataset into MongoDB (needs MONGODB_URI)
```

## Environment

| Var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3010` | HTTP port |
| `MONGODB_URI` | _(empty)_ | MongoDB connection string; empty = demo mode |
| `OPENCAGE_API_KEY` | _(empty)_ | Optional server-side geocoding for cities missing from the bundled table |
| `REFRESH_MINUTES` | `10` | Reload interval in MongoDB mode |
| `DEMO_SEED` | `42` | PRNG seed for the demo dataset |
| `CORS_ORIGIN` | `*` | Allowed origin(s), comma separated |

## Endpoints

Full contract: [`../docs/API.md`](../docs/API.md). Highlights:

- `/api/health`, `/api/meta`, `/api/summary`, `/api/insights`
- `/api/sales/{timeseries,growth,heatmap,forecast,channels,categories}`
- `/api/orders`, `/api/orders/recent`, `/api/orders/status`, `/api/orders/:id`
- `/api/products`, `/api/products/top`, `/api/products/inventory`
- `/api/customers`, `/api/customers/{top,new,repeat,cohorts,geo,rfm}`
- Legacy v1 routes (`/api/customers/getCustomerCount`, `/api/sales/getSalesData`, ...) keep their original shapes.

Responses are `{ success: true, data }`; errors are `{ success: false, message }`. GET responses are cached in memory for 60s (cleared on data refresh).

## Layout

```
server.js               entry (loads .env, initialises the store, listens)
src/app.js              express app: helmet, compression, cors, routes, SPA fallback
src/data/generator.js   seeded demo dataset generator
src/data/cities.js      bundled city table + aliases (geocoding)
src/data/store.js       singleton store: Mongo/demo loading, normalization, indexes
src/analytics/*.js      pure analytics over the normalized state
src/routes, src/controllers, src/middleware
scripts/seed.js         write the demo dataset to MongoDB
test/                   node --test suite
```

The built SPA is served from `../frontend/dist` when it exists.
