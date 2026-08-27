import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/salesController.js";

const router = Router();
router.get("/timeseries", asyncHandler(c.timeseries));
router.get("/growth", asyncHandler(c.growth));
router.get("/heatmap", asyncHandler(c.heatmap));
router.get("/forecast", asyncHandler(c.forecast));
router.get("/channels", asyncHandler(c.channels));
router.get("/categories", asyncHandler(c.categories));
export default router;
