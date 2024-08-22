import express, { Router } from "express";
import {
  getTotalOrderCount,
  
} from "../controllers/orderController.js";

const orderRoutes = express.Router();

orderRoutes.get("/getTotalOrderCount", getTotalOrderCount);


export default orderRoutes;
