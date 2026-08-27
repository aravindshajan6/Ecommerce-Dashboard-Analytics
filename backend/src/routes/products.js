import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/productsController.js";

const router = Router();
router.get("/", asyncHandler(c.list));
router.get("/top", asyncHandler(c.top));
router.get("/inventory", asyncHandler(c.inventory));
export default router;
