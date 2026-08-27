import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./src/app.js";
import { init, close } from "./src/data/store.js";

const PORT = Number(process.env.PORT) || 3010;

try {
  const state = await init();
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT} (data source: ${state.source})`);
  });
  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close();
    await close();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
} catch (err) {
  console.error("[server] failed to start:", err);
  process.exit(1);
}
