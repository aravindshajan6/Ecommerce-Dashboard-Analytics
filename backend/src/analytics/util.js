/**
 * Shared helpers for the analytics layer. Everything here is pure and works in UTC.
 */

export const DAY = 86_400_000;
export const RANGES = ["7d", "30d", "90d", "12m", "ytd", "all"];
export const INTERVALS = ["daily", "weekly", "monthly", "quarterly", "yearly"];

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const pad = (n) => String(n).padStart(2, "0");
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
/** 4dp rounding for ratios/shares (0..1). */
export const round4 = (n) => Math.round((Number(n) || 0) * 10000) / 10000;

/** Percentage change from b to a (number, 2dp) or null when b is 0/absent. */
export function pct(a, b) {
  if (!b) return null;
  return round2(((a - b) / Math.abs(b)) * 100);
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function addMonthsUTC(date, months) {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

export function assertRange(range) {
  if (range != null && !RANGES.includes(range)) {
    throw new ApiError(400, `Invalid range "${range}". Expected one of ${RANGES.join(", ")}.`);
  }
}

export function assertInterval(interval, allowed = INTERVALS) {
  if (interval != null && !allowed.includes(interval)) {
    throw new ApiError(400, `Invalid interval "${interval}". Expected one of ${allowed.join(", ")}.`);
  }
}

/**
 * Resolve a range keyword into absolute bounds.
 * Current period: [from, to] (inclusive). Previous period: [previousFrom, previousTo) of equal length.
 * For "all" the previous period is null and `from` falls back to `minTs` (earliest data point).
 */
export function resolveRange(range = "12m", now = Date.now(), minTs = null) {
  assertRange(range);
  const to = new Date(now);
  let from;
  let previousFrom = null;
  let previousTo = null;
  switch (range) {
    case "7d":
    case "30d":
    case "90d": {
      const days = parseInt(range, 10);
      from = new Date(to.getTime() - days * DAY);
      previousTo = from;
      previousFrom = new Date(from.getTime() - days * DAY);
      break;
    }
    case "12m":
      from = addMonthsUTC(to, -12);
      previousTo = from;
      previousFrom = addMonthsUTC(to, -24);
      break;
    case "ytd":
      from = new Date(Date.UTC(to.getUTCFullYear(), 0, 1));
      previousFrom = new Date(Date.UTC(to.getUTCFullYear() - 1, 0, 1));
      previousTo = addMonthsUTC(to, -12);
      break;
    case "all":
    default:
      from = new Date(minTs ?? Date.UTC(2000, 0, 1));
      break;
  }
  return { range, from, to, previousFrom, previousTo };
}

/** First index in an ascending-by-ts array with ts >= t. */
export function lowerBound(sorted, t) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid].ts < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Slice of `sorted` (ascending ts) with from <= ts <= to (to exclusive when `toExclusive`). */
export function sliceByTs(sorted, from, to, toExclusive = false) {
  if (!sorted.length) return [];
  const fromTs = from ? new Date(from).getTime() : -Infinity;
  const toTs = to ? new Date(to).getTime() : Infinity;
  const start = lowerBound(sorted, fromTs);
  let end = start;
  while (end < sorted.length && (toExclusive ? sorted[end].ts < toTs : sorted[end].ts <= toTs)) end++;
  return sorted.slice(start, end);
}

// ---------- period buckets ----------

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const year = t.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart) / DAY + 1) / 7);
  return { year, week };
}

/** Sortable bucket key for a date at the given interval. */
export function bucketKey(date, interval = "monthly") {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  switch (interval) {
    case "daily":
      return `${y}-${pad(m)}-${pad(d.getUTCDate())}`;
    case "weekly": {
      const { year, week } = isoWeek(d);
      return `${year}-W${pad(week)}`;
    }
    case "quarterly":
      return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
    case "yearly":
      return String(y);
    case "monthly":
    default:
      return `${y}-${pad(m)}`;
  }
}

/** Human-friendly label for a bucket key. */
export function bucketLabel(key, interval = "monthly") {
  switch (interval) {
    case "daily": {
      const [y, m, d] = key.split("-").map(Number);
      return `${d} ${MONTHS[m - 1]} '${String(y).slice(2)}`;
    }
    case "weekly": {
      const [y, w] = key.split("-W");
      return `W${parseInt(w, 10)} '${String(y).slice(2)}`;
    }
    case "quarterly": {
      const [y, q] = key.split("-");
      return `${q} ${y}`;
    }
    case "yearly":
      return key;
    case "monthly":
    default: {
      const [y, m] = key.split("-").map(Number);
      return `${MONTHS[m - 1]} ${y}`;
    }
  }
}

/** Start date (UTC) of a bucket key. */
export function bucketStart(key, interval = "monthly") {
  switch (interval) {
    case "daily": {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
    case "weekly": {
      const [y, w] = key.split("-W").map(Number);
      const jan4 = new Date(Date.UTC(y, 0, 4));
      const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * DAY);
      return new Date(monday.getTime() + (w - 1) * 7 * DAY);
    }
    case "quarterly": {
      const [y, q] = key.split("-Q").map(Number);
      return new Date(Date.UTC(y, (q - 1) * 3, 1));
    }
    case "yearly":
      return new Date(Date.UTC(Number(key), 0, 1));
    case "monthly":
    default: {
      const [y, m] = key.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, 1));
    }
  }
}

export function addInterval(date, interval = "monthly", n = 1) {
  const d = new Date(date);
  switch (interval) {
    case "daily":
      return new Date(d.getTime() + n * DAY);
    case "weekly":
      return new Date(d.getTime() + n * 7 * DAY);
    case "quarterly":
      return addMonthsUTC(d, 3 * n);
    case "yearly":
      return addMonthsUTC(d, 12 * n);
    case "monthly":
    default:
      return addMonthsUTC(d, n);
  }
}

/**
 * Produce a continuous, ascending list of buckets from `from` to `to`, merging
 * in values from `map` (Map<key, object>) and filling gaps with `empty()`.
 */
export function fillMissingBuckets(map, interval, from, to, empty = () => ({})) {
  const out = [];
  if (!from || !to) return out;
  const endTs = new Date(to).getTime();
  let cursor = bucketStart(bucketKey(from, interval), interval);
  let guard = 0;
  while (cursor.getTime() <= endTs && guard++ < 20_000) {
    const key = bucketKey(cursor, interval);
    out.push({ period: key, label: bucketLabel(key, interval), ...empty(), ...(map.get(key) ?? {}) });
    cursor = addInterval(cursor, interval, 1);
  }
  return out;
}

/** Count of calendar months between two dates (month index difference). */
export const monthIndex = (d) => d.getUTCFullYear() * 12 + d.getUTCMonth();

// ---------- collections ----------

export function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date) a = a.getTime();
  if (b instanceof Date) b = b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

export function parseSort(sort, fallback) {
  const raw = typeof sort === "string" && sort.trim() ? sort : fallback;
  if (!raw) return null;
  const [field, dir = "asc"] = raw.split(":");
  return { field: field.trim(), desc: dir.trim().toLowerCase() === "desc" };
}

export function sortRows(rows, sort, fallback) {
  const s = parseSort(sort, fallback);
  if (!s) return rows;
  const sorted = [...rows].sort((a, b) => compareValues(getPath(a, s.field), getPath(b, s.field)));
  return s.desc ? sorted.reverse() : sorted;
}

/**
 * Generic search + sort + pagination over an in-memory row array.
 * `sort` is "field:asc|desc" (dotted paths ok). Returns { rows, total, page, limit, pages }.
 */
export function paginate(rows, { page, limit, search, sort, searchFields = [], defaultSort } = {}) {
  let list = rows;
  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    list = list.filter((r) => searchFields.some((f) => String(getPath(r, f) ?? "").toLowerCase().includes(q)));
  }
  list = sortRows(list, sort, defaultSort);
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / l));
  return { rows: list.slice((p - 1) * l, p * l), total, page: p, limit: l, pages };
}

export function sum(arr, fn = (x) => x) {
  let s = 0;
  for (const x of arr) s += fn(x) || 0;
  return s;
}

export function mean(arr) {
  return arr.length ? sum(arr) / arr.length : 0;
}

export function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(sum(arr, (x) => (x - m) ** 2) / (arr.length - 1));
}

/** Per-state memo so expensive derived tables (RFM, product stats) are computed once per load. */
const memoStore = new WeakMap();
export function memo(state, key, fn) {
  let bucket = memoStore.get(state);
  if (!bucket) {
    bucket = new Map();
    memoStore.set(state, bucket);
  }
  if (!bucket.has(key)) bucket.set(key, fn());
  return bucket.get(key);
}
