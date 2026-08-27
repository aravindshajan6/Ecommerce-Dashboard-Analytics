/** Small pure helpers shared by the sales/overview charts (kept out of component files for react-refresh). */

export const defaultInterval = (range) => (range === '7d' || range === '30d' ? 'daily' : range === '90d' ? 'weekly' : 'monthly');

/** /api/sales/growth only accepts monthly|quarterly|yearly. */
export const growthInterval = (interval) => (interval === 'daily' || interval === 'weekly' ? 'monthly' : interval);

/** Trailing moving average of `key` over `window` buckets, written to `out`. */
export function movingAverage(rows = [], { key = 'revenue', window = 7, out = 'movingAvg' } = {}) {
  let sum = 0;
  return rows.map((r, i) => {
    sum += r[key] || 0;
    if (i >= window) sum -= rows[i - window][key] || 0;
    return { ...r, [out]: sum / Math.min(i + 1, window) };
  });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Human label for API `period` keys: 2024-03 → "Mar 24", 2024-Q1 → "Q1 24", 2024-03-14 → "Mar 14". */
export function periodLabel(period) {
  const s = String(period ?? '');
  let m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return `${MONTHS[+m[2] - 1]} ${+m[3]}`;
  if ((m = s.match(/^(\d{4})-(\d{2})$/))) return `${MONTHS[+m[2] - 1]} ${m[1].slice(2)}`;
  if ((m = s.match(/^(\d{4})-(Q\d|W\d{1,2})$/))) return `${m[2]} ${m[1].slice(2)}`;
  return s;
}

export const truncate = (s = '', n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** React useId() output contains punctuation that breaks `url(#id)` references. */
export const svgId = (id) => `g${String(id).replace(/[^a-zA-Z0-9]/g, '')}`;

export const hourLabel = (h) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`);
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
