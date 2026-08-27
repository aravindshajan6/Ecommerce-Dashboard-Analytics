import { RANGES, INTERVALS } from "../analytics/util.js";

/** 400 on invalid `range` / `interval` query params (when present). */
export function validateQuery(req, res, next) {
  const { range, interval } = req.query;
  if (range != null && !RANGES.includes(range)) {
    return res.status(400).json({ success: false, message: `Invalid range "${range}". Expected one of ${RANGES.join(", ")}.` });
  }
  if (interval != null && !INTERVALS.includes(interval)) {
    return res.status(400).json({ success: false, message: `Invalid interval "${interval}". Expected one of ${INTERVALS.join(", ")}.` });
  }
  next();
}
export default validateQuery;
