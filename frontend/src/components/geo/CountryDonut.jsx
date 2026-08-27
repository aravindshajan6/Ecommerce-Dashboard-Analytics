import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Globe } from 'lucide-react';
import { GlassCard, ChartSkeleton, ErrorState, EmptyState, Skeleton } from '../ui/index.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import { SERIES, animation } from '../charts/theme.js';
import { fmtNumber, fmtPct } from '../../lib/format.js';
import { flagEmoji } from './flag.js';

const H = 300;
const TOP = 7;

function aggregate(points) {
  const map = new Map();
  points.forEach((p) => {
    const key = p.country || 'Unknown';
    const cur = map.get(key) || { country: key, countryCode: p.countryCode, customers: 0, revenue: 0, cities: 0 };
    cur.customers += p.customers || 0;
    cur.revenue += p.revenue || 0;
    cur.cities += 1;
    if (!cur.countryCode && p.countryCode) cur.countryCode = p.countryCode;
    map.set(key, cur);
  });
  const all = [...map.values()].sort((a, b) => b.customers - a.customers);
  const total = all.reduce((s, c) => s + c.customers, 0) || 1;
  const head = all.slice(0, TOP);
  const tail = all.slice(TOP);
  if (tail.length) head.push({ country: `Other (${tail.length})`, customers: tail.reduce((s, c) => s + c.customers, 0), revenue: tail.reduce((s, c) => s + c.revenue, 0), cities: tail.reduce((s, c) => s + c.cities, 0) });
  return { rows: head.map((c) => ({ ...c, share: c.customers / total })), total };
}

/** Donut — customers by country. Props: { points, loading, error, retry, className } */
export default function CountryDonut({ points = [], loading, error, retry, className }) {
  const { rows, total } = useMemo(() => aggregate(points), [points]);
  const [hover, setHover] = useState(null);

  return (
    <GlassCard title="Customers by country" subtitle="Aggregated from geocoded cities" icon={Globe} className={clsx('min-h-[420px]', className)}>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2"><ChartSkeleton height={H} bars={6} /><div className="space-y-2.5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5" />)}</div></div>
      ) : error ? (
        <div className="grid place-items-center" style={{ height: H }}><ErrorState error={error} retry={retry} /></div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center" style={{ height: H }}><EmptyState title="No country data yet" /></div>
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-2">
          <div className="relative" style={{ height: H }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltip format={(v) => `${fmtNumber(v)} (${fmtPct((v / total) * 100)})`} />} />
                <Pie
                  data={rows} dataKey="customers" nameKey="country" cx="50%" cy="50%" innerRadius="62%" outerRadius="88%"
                  paddingAngle={2} cornerRadius={6} stroke="none"
                  onMouseEnter={(_, i) => setHover(i)} onMouseLeave={() => setHover(null)} {...animation}
                >
                  {rows.map((r, i) => (
                    <Cell key={r.country} fill={SERIES[i % SERIES.length]} fillOpacity={hover == null || hover === i ? 0.95 : 0.35} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-2xl font-semibold tabular text-fg">{hover != null ? fmtNumber(rows[hover].customers) : fmtNumber(total)}</p>
                <p className="max-w-[120px] truncate text-[11px] text-fg-3">{hover != null ? rows[hover].country : 'customers'}</p>
              </div>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm">
            {rows.map((r, i) => (
              <li
                key={r.country}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                className={clsx('flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors', hover === i && 'bg-line/5')}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
                <span className="min-w-0 flex-1 truncate text-fg">{flagEmoji(r.countryCode)} {r.country}</span>
                <span className="text-xs tabular text-fg-2">{fmtNumber(r.customers)}</span>
                <span className="w-12 text-right text-xs tabular text-fg-3">{fmtPct(r.share * 100)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
