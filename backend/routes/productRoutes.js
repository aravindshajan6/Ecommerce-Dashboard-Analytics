import express, { Router } from "express";
import { getTotalProducts } from "../controllers/productsController.js";

const productsRoutes = express.Router();

productsRoutes.get("/getTotalProducts", getTotalProducts);


export default productsRoutes;