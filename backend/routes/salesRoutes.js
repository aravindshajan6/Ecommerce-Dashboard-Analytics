import express, { Router } from "express";
import {
  dailySales,
  monthlySales,
  quarterlySales,
  yearlySales,
  yearlySalesGrowthRate,
} from "../controllers/salesController.js";

const salesRoutes = express.Router();

salesRoutes.get("/dailySales", dailySales);
salesRoutes.get("/monthlySales", monthlySales);
salesRoutes.get("/quarterlySales", quarterlySales);
salesRoutes.get("/yearlySales", yearlySales);
salesRoutes.get("/yearlyGrowthRate", yearlySalesGrowthRate);

export default salesRoutes;
