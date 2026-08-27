let currency = 'INR';
export const setCurrency = (c) => { if (c) currency = c; };
export const getCurrency = () => currency;

const compactFmt = new Map();
function compact(locale, cur) {
  const key = `${locale}|${cur}`;
  if (!compactFmt.has(key)) {
    compactFmt.set(key, new Intl.NumberFormat(locale, { style: 'currency', currency: cur, notation: 'compact', maximumFractionDigits: 1 }));
  }
  return compactFmt.get(key);
}

/** Currency, compact by default (₹1.2M). Pass { full: true } for full precision. */
export function fmtMoney(v, { full = false, cur = currency } = {}) {
  if (v == null || Number.isNaN(v)) return '—';
  const locale = cur === 'INR' ? 'en-IN' : 'en-US';
  if (full) return new Intl.NumberFormat(locale, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v);
  if (Math.abs(v) < 10_000) return new Intl.NumberFormat(locale, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v);
  return compact(locale, cur).format(v);
}

export function fmtNumber(v, { compact: c = false, digits = 0 } = {}) {
  if (v == null || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat('en-US', { notation: c ? 'compact' : 'standard', maximumFractionDigits: digits }).format(v);
}

export function fmtPct(v, { digits = 1, sign = false } = {}) {
  if (v == null || Number.isNaN(v)) return '—';
  const s = `${Math.abs(v).toFixed(digits)}%`;
  return sign ? `${v > 0 ? '+' : v < 0 ? '−' : ''}${s}` : s;
}

export function fmtDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-US', opts).format(d);
}

export function fmtDateTime(iso) {
  return fmtDate(iso, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(iso, { month: 'short', day: 'numeric' });
}

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '?';

/** Stable hue from a string, for avatars/category colors. */
export function hueFor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}
