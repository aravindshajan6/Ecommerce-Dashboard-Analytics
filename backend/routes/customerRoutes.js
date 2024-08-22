import {
  clvByCohorts,
  // dailyNewCustomers,
  geographicalDistribution,
  getAllCustomers,
  getRepeatCustomers,
  // monthlyNewCustomers,
  newCustomersAdded,
  // yearlyNewCustomers,
} from "../controllers/customerController.js";
import { Router } from "express";

const customerRoutes = Router();

customerRoutes.get("/getAllCustomers", getAllCustomers);

// customerRoutes.get("/monthlyNewCustomers", monthlyNewCustomers);
// customerRoutes.get("/dailyNewCustomers", dailyNewCustomers);
// customerRoutes.get("/yearlyNewCustomers", yearlyNewCustomers);

customerRoutes.get("/geographicalDistribution", geographicalDistribution);


customerRoutes.get("/clvByCohorts", clvByCohorts);


customerRoutes.get("/newCustomersAdded", newCustomersAdded);


customerRoutes.get("/getRepeatCustomers", getRepeatCustomers);


export default customerRoutes;
