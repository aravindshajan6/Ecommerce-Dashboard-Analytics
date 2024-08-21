import express, { Router } from "express";
import {
  // dailySales,
  getSalesData,
  getTotalSalesAmount,
  // monthlySales,
  // quarterlySales,
  // yearlySales,
  yearlySalesGrowthRate,
} from "../controllers/salesController.js";

const salesRoutes = express.Router();

// salesRoutes.get("/dailySales", dailySales);
// salesRoutes.get("/monthlySales", monthlySales);
// salesRoutes.get("/quarterlySales", quarterlySales);
// salesRoutes.get("/yearlySales", yearlySales);

salesRoutes.get("/getTotalSalesAmount", getTotalSalesAmount);

salesRoutes.get("/getSalesData", getSalesData);

salesRoutes.get("/yearlyGrowthRate", yearlySalesGrowthRate);

export default salesRoutes;
