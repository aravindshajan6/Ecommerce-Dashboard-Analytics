import express, { Router } from 'express';
import { getAllOrders } from '../controllers/orderController.js';

const orderRoutes = express.Router();

orderRoutes.get('/getAllOrders', getAllOrders);

export default orderRoutes;