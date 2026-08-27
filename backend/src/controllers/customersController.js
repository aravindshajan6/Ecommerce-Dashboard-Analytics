import { getState } from "../data/store.js";
import * as customers from "../analytics/customers.js";

const ok = (res, data) => res.json({ success: true, data });
const opts = (req) => ({ ...req.query, now: Date.now() });

export const list = (req, res) => ok(res, customers.listCustomers(getState(), opts(req)));
export const top = (req, res) => ok(res, customers.topCustomers(getState(), opts(req)));
export const newCustomers = (req, res) => ok(res, customers.newCustomers(getState(), opts(req)));
export const repeat = (req, res) => ok(res, customers.repeatCustomers(getState(), opts(req)));
export const cohorts = (req, res) => ok(res, customers.cohorts(getState(), opts(req)));
export const geo = async (req, res) => ok(res, await customers.geo(getState()));
export const rfm = (req, res) => ok(res, customers.getRfm(getState(), opts(req)));
