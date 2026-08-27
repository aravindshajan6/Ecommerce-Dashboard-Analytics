import { useMemo } from 'react';
import clsx from 'clsx';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Landmark } from 'lucide-react';
import { GlassCard, ChartSkeleton, ErrorState, EmptyState } from '../ui/index.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import { C, axisProps, gridProps, animation } from '../charts/theme.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';

const H = 340;

/** Horizontal bars — top 10 cities by revenue. Props: { points, loading, error, retry, selected, onSelect(city|null), className } */
export default function TopCitiesBar({ points = [], loading, error, retry, selected = null, onSelect, className }) {
  const rows = useMemo(() => [...points].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 10), [points]);
  const fmt = (v) => fmtMoney(v, { full: true });
  const label = (l, payload) => {
    const p = payload?.[0]?.payload;
    if (!p) return l;
    return `${l}${p.country ? `, ${p.country}` : ''} · ${fmtNumber(p.customers)} customers`;
  };

  return (
    <GlassCard title="Top 10 cities by revenue" subtitle="Click a bar to focus the city" icon={Landmark} className={clsx('min-h-[420px]', className)}>
      {loading ? (
        <ChartSkeleton height={H} bars={10} />
      ) : error ? (
        <div className="grid place-items-center" style={{ height: H }}><ErrorState error={error} retry={retry} /></div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center" style={{ height: H }}><EmptyState title="No city revenue yet" /></div>
      ) : (
        <div style={{ height: H }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barCategoryGap={6}>
              <CartesianGrid {...gridProps} vertical horizontal={false} />
              <XAxis type="number" {...axisProps} tickFormatter={(v) => fmtMoney(v)} />
              <YAxis type="category" dataKey="city" {...axisProps} width={96} interval={0} tick={{ fill: 'rgb(var(--fg-2))', fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'rgb(var(--line) / 0.05)' }}
                content={<ChartTooltip format={fmt} labelFormat={label} />}
              />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 8, 8, 0]} maxBarSize={22} onClick={(d) => onSelect?.(d?.city === selected ? null : d?.city ?? null)} className="cursor-pointer" {...animation}>
                {rows.map((r) => (
                  <Cell key={r.city} fill={r.city === selected ? C.pink : C.primary} fillOpacity={selected && r.city !== selected ? 0.45 : 0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
