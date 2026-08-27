import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/customersController.js";

const router = Router();
router.get("/", asyncHandler(c.list));
router.get("/top", asyncHandler(c.top));
router.get("/new", asyncHandler(c.newCustomers));
router.get("/repeat", asyncHandler(c.repeat));
router.get("/cohorts", asyncHandler(c.cohorts));
router.get("/geo", asyncHandler(c.geo));
router.get("/rfm", asyncHandler(c.rfm));
export default router;
