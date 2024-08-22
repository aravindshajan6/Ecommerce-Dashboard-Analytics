import express from "express";
import {
  getSalesData,
  getTotalSalesAmount,
  yearlySalesGrowthRate,
} from "../controllers/salesController.js";

const salesRoutes = express.Router();

salesRoutes.get("/getTotalSalesAmount", getTotalSalesAmount);

salesRoutes.get("/getSalesData", getSalesData);

salesRoutes.get("/yearlyGrowthRate", yearlySalesGrowthRate);

export default salesRoutes;
