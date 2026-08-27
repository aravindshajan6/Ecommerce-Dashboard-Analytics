import { getState } from "../data/store.js";
import * as products from "../analytics/products.js";

const ok = (res, data) => res.json({ success: true, data });
const opts = (req) => ({ ...req.query, now: Date.now() });

export const list = (req, res) => ok(res, products.listProducts(getState(), opts(req)));
export const top = (req, res) => ok(res, products.topProducts(getState(), opts(req)));
export const inventory = (req, res) => ok(res, products.inventory(getState(), opts(req)));
