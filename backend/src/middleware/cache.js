/** Tiny in-memory response cache keyed by URL (GET only, 2xx JSON only). */
export function createCache({ ttlMs = 60_000, skip = () => false } = {}) {
  const entries = new Map();
  const middleware = (req, res, next) => {
    if (req.method !== "GET" || skip(req)) return next();
    const key = req.originalUrl;
    const hit = entries.get(key);
    if (hit && hit.expires > Date.now()) {
      res.set("X-Cache", "HIT");
      return res.status(hit.status).json(hit.body);
    }
    const json = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) entries.set(key, { status: res.statusCode, body, expires: Date.now() + ttlMs });
      res.set("X-Cache", "MISS");
      return json(body);
    };
    next();
  };
  middleware.clear = () => entries.clear();
  middleware.size = () => entries.size;
  return middleware;
}
export default createCache;
