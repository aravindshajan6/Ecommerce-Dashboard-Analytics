import express from "express";
import { getTop10Products, getTotalProducts } from "../controllers/productsController.js";

const productsRoutes = express.Router();

productsRoutes.get("/getTotalProducts", getTotalProducts);

productsRoutes.get("/getTop10Products", getTop10Products);



export default productsRoutes;