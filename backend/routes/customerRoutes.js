import { getAllCustomers } from "../controllers/customerController.js";
import {Router} from 'express';

const customerRoutes = Router();

customerRoutes.get('/getAllCustomers', getAllCustomers);

export default customerRoutes;


