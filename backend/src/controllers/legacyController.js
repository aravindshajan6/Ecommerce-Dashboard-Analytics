import { getState } from "../data/store.js";
import * as legacy from "../analytics/legacy.js";

export const getCustomerCount = (req, res) => res.json(legacy.customerCount(getState()));
export const newCustomersAdded = (req, res) => res.json(legacy.newCustomersAdded(getState(), req.query));
export const getRepeatCustomers = (req, res) => res.json(legacy.repeatCustomers(getState(), req.query));
export const clvByCohorts = (req, res) => res.json(legacy.clvByCohorts(getState()));
export const geographicalDistribution = (req, res) => res.json(legacy.geographicalDistribution(getState()));
export const getTotalOrderCount = (req, res) => res.json(legacy.totalOrderCount(getState()));
export const getTotalProducts = (req, res) => res.json(legacy.totalProducts(getState()));
export const getTop10Products = (req, res) => res.json(legacy.topProducts(getState()));
export const getTotalSalesAmount = (req, res) => res.json(legacy.totalSalesAmount(getState()));
export const getSalesData = (req, res) => res.json(legacy.salesData(getState(), req.query));
export const yearlyGrowthRate = (req, res) => res.json(legacy.yearlySalesGrowthRate(getState()));
