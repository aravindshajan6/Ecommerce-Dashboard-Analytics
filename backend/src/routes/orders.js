import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/ordersController.js";

const router = Router();
router.get("/", asyncHandler(c.list));
router.get("/recent", asyncHandler(c.recent));
router.get("/status", asyncHandler(c.status));
router.get("/:id", asyncHandler(c.detail));
export default router;
