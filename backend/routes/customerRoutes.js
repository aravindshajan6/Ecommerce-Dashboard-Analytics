import {
  clvByCohorts,
  dailyNewCustomers,
  geographicalDistribution,
  getAllCustomers,
  monthlyNewCustomers,
  yearlyNewCustomers,
} from "../controllers/customerController.js";
import { Router } from "express";

const customerRoutes = Router();

customerRoutes.get("/getAllCustomers", getAllCustomers);

customerRoutes.get("/monthlyNewCustomers", monthlyNewCustomers);
customerRoutes.get("/dailyNewCustomers", dailyNewCustomers);
customerRoutes.get("/yearlyNewCustomers", yearlyNewCustomers);

customerRoutes.get("/geographicalDistribution", geographicalDistribution);

customerRoutes.get("/clvByCohorts", clvByCohorts);

export default customerRoutes;
