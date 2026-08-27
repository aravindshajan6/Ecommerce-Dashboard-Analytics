import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Layers } from 'lucide-react';
import { ChartSkeleton, EmptyState, ErrorState, GlassCard } from '../ui/index.js';
import { useSalesCategories } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber, fmtPct } from '../../lib/format.js';
import { SERIES, animation, axisProps, gridProps } from '../charts/theme.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';

const HEIGHT = 300;
const MAX = 10;
/** API `share` may be 0..1 or already a percent; normalise to percent. */
const asPct = (s) => (s == null ? null : s <= 1 ? s * 100 : s);

export default function CategoryBars({ className }) {
  const { data, isPending, isError, error, refetch } = useSalesCategories();
  const rows = [...(data ?? [])].sort((a, b) => b.revenue - a.revenue).slice(0, MAX);

  let body;
  if (isPending) body = <ChartSkeleton height={HEIGHT} bars={8} />;
  else if (isError) body = <Frame><ErrorState error={error} retry={refetch} /></Frame>;
  else if (rows.length === 0) body = <Frame><EmptyState title="No category data" body="Categories appear once products have sales in this range." /></Frame>;
  else {
    body = (
      <div style={{ height: HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" {...axisProps} tickFormatter={(v) => fmtMoney(v)} />
            <YAxis type="category" dataKey="category" {...axisProps} width={112} tick={{ ...axisProps.tick, fill: 'rgb(var(--fg-2))' }} />
            <Tooltip
              cursor={{ fill: 'rgb(var(--line) / 0.05)' }}
              content={
                <ChartTooltip
                  format={(v, _n, p) => `${fmtMoney(v, { full: true })} · ${fmtNumber(p?.payload?.units)} units`}
                  labelFormat={(l, p) => { const s = asPct(p?.[0]?.payload?.share); return s == null ? l : `${l} · ${fmtPct(s)} of revenue`; }}
                />
              }
            />
            <Bar dataKey="revenue" name="Revenue" radius={[0, 8, 8, 0]} maxBarSize={22} {...animation}>
              {rows.map((r, i) => <Cell key={r.category} fill={SERIES[i % SERIES.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <GlassCard className={`min-h-[380px] ${className ?? ''}`} icon={Layers} title="Revenue by category" subtitle={data && data.length > MAX ? `Top ${MAX} of ${data.length} categories` : 'Category mix for the selected range'}>
      {body}
    </GlassCard>
  );
}

function Frame({ children }) {
  return <div className="grid place-items-center" style={{ height: HEIGHT }}>{children}</div>;
}
