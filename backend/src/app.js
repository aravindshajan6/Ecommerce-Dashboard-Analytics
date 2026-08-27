import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import apiRouter from "./routes/index.js";
import { createCache } from "./middleware/cache.js";
import { errorHandler, notFoundApi } from "./middleware/errorHandler.js";
import { onRefresh } from "./data/store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FRONTEND_DIST = path.resolve(__dirname, "../../frontend/dist");

export function createApp({ cacheTtlMs = 60_000 } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(compression());
  const origin = process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*" ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()) : "*";
  app.use(cors({ origin, optionsSuccessStatus: 200 }));
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") app.use(morgan("dev"));
  app.use(express.json());

  const cache = createCache({ ttlMs: cacheTtlMs, skip: (req) => req.path === "/health" });
  onRefresh(() => cache.clear());
  app.locals.cache = cache;

  app.use("/api", cache, apiRouter);
  app.all("/api/*", notFoundApi);

  // built SPA
  const indexHtml = path.join(FRONTEND_DIST, "index.html");
  app.use(express.static(FRONTEND_DIST, { index: "index.html", maxAge: "1h" }));
  app.get("*", (req, res) => {
    if (req.method !== "GET") return res.status(404).end();
    if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
    res.status(200).json({ success: true, message: "API is running. The frontend is not built yet - run `npm run build` in ../frontend, or use the /api/* endpoints." });
  });

  app.use(errorHandler);
  return app;
}

export default createApp;
