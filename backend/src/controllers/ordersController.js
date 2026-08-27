import { getState } from "../data/store.js";
import * as orders from "../analytics/orders.js";

const ok = (res, data) => res.json({ success: true, data });
const opts = (req) => ({ ...req.query, now: Date.now() });

export const list = (req, res) => ok(res, orders.listOrders(getState(), opts(req)));
export const recent = (req, res) => ok(res, orders.recentOrders(getState(), opts(req)));
export const status = (req, res) => ok(res, orders.orderStatus(getState(), opts(req)));
export const detail = (req, res) => ok(res, orders.orderDetail(getState(), req.params.id));
