import { getState } from "../data/store.js";
import { getSummary } from "../analytics/summary.js";
import { getInsights } from "../analytics/insights.js";

export const summary = (req, res) => res.json({ success: true, data: getSummary(getState(), { range: req.query.range ?? "12m", now: Date.now() }) });
export const insights = (req, res) => res.json({ success: true, data: getInsights(getState(), { range: req.query.range ?? "30d", now: Date.now() }) });
