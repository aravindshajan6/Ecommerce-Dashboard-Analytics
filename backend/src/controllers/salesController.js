import { getState } from "../data/store.js";
import * as sales from "../analytics/sales.js";

const ok = (res, data) => res.json({ success: true, data });
const opts = (req) => ({ ...req.query, now: Date.now() });

export const timeseries = (req, res) => ok(res, sales.getTimeseries(getState(), opts(req)));
export const growth = (req, res) => ok(res, sales.getGrowth(getState(), opts(req)));
export const heatmap = (req, res) => ok(res, sales.getHeatmap(getState(), opts(req)));
export const forecast = (req, res) => ok(res, sales.getForecast(getState(), opts(req)));
export const channels = (req, res) => ok(res, sales.getChannels(getState(), opts(req)));
export const categories = (req, res) => ok(res, sales.getCategories(getState(), opts(req)));
