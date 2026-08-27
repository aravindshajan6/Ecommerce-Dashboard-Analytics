import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/legacyController.js";

/** v1 endpoints with their original response shapes (mounted before the v2 routers). */
const router = Router();
router.get("/customers/getCustomerCount", asyncHandler(c.getCustomerCount));
router.get("/customers/newCustomersAdded", asyncHandler(c.newCustomersAdded));
router.get("/customers/getRepeatCustomers", asyncHandler(c.getRepeatCustomers));
router.get("/customers/clvByCohorts", asyncHandler(c.clvByCohorts));
router.get("/customers/geographicalDistribution", asyncHandler(c.geographicalDistribution));
router.get("/orders/getTotalOrderCount", asyncHandler(c.getTotalOrderCount));
router.get("/products/getTotalProducts", asyncHandler(c.getTotalProducts));
router.get("/products/getTop10Products", asyncHandler(c.getTop10Products));
router.get("/sales/getTotalSalesAmount", asyncHandler(c.getTotalSalesAmount));
router.get("/sales/getSalesData", asyncHandler(c.getSalesData));
router.get("/sales/yearlyGrowthRate", asyncHandler(c.yearlyGrowthRate));
export default router;
