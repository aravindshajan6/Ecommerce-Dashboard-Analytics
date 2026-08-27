import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateQuery } from "../middleware/validate.js";
import * as meta from "../controllers/metaController.js";
import * as summary from "../controllers/summaryController.js";
import legacyRouter from "./legacy.js";
import salesRouter from "./sales.js";
import ordersRouter from "./orders.js";
import productsRouter from "./products.js";
import customersRouter from "./customers.js";

const api = Router();
api.get("/health", asyncHandler(meta.health));
api.get("/meta", asyncHandler(meta.meta));

// v1 compatibility routes keep their own param handling
api.use(legacyRouter);

api.use(validateQuery);
api.get("/summary", asyncHandler(summary.summary));
api.get("/insights", asyncHandler(summary.insights));
api.use("/sales", salesRouter);
api.use("/orders", ordersRouter);
api.use("/products", productsRouter);
api.use("/customers", customersRouter);

export default api;
