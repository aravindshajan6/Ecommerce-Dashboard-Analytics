import express, { Router } from "express";
import {
  dailyRepeatCustomers,
  getAllOrders,
  monthlyRepeatCustomers,
  quarterlyRepeatCustomers,
  yearlyRepeatCustomers,
} from "../controllers/orderController.js";

const orderRoutes = express.Router();

orderRoutes.get("/getAllOrders", getAllOrders);

orderRoutes.get("/dailyRepeatCustomers", dailyRepeatCustomers);
orderRoutes.get("/monthlyRepeatCustomers", monthlyRepeatCustomers);
orderRoutes.get("/yearlyRepeatCustomers", yearlyRepeatCustomers);
orderRoutes.get("/quarterlyRepeatCustomers", quarterlyRepeatCustomers);

export default orderRoutes;
