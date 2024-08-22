import {
  clvByCohorts,
  geographicalDistribution,
  getAllCustomers,
  getCustomerCount,
  getRepeatCustomers,
  newCustomersAdded,
} from "../controllers/customerController.js";
import { Router } from "express";

const customerRoutes = Router();

customerRoutes.get("/getAllCustomers", getAllCustomers);

customerRoutes.get("/getCustomerCount", getCustomerCount);

customerRoutes.get("/newCustomersAdded", newCustomersAdded);

customerRoutes.get("/getRepeatCustomers", getRepeatCustomers);

customerRoutes.get("/clvByCohorts", clvByCohorts);

customerRoutes.get("/geographicalDistribution", geographicalDistribution);

export default customerRoutes;
