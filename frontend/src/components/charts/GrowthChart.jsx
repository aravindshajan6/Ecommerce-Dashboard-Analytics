import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { GlassCard } from '../ui/index.js';
import { useSalesGrowth } from '../../hooks/useApi.js';
import { fmtMoney, fmtPct } from '../../lib/format.js';
import { C, axisProps, gridProps } from './theme.js';
import ChartTooltip from './ChartTooltip.jsx';
import QueryState from './QueryState.jsx';

const fmt = (v, name) => (name === 'Growth' ? fmtPct(v, { sign: true }) : fmtMoney(v, { full: true }));
const legendText = (value) => <span className="text-xs text-fg-2">{value}</span>;
const barColor = (g) => (g == null ? C.fg3 : g >= 0 ? C.success : C.danger);

const LABEL = { monthly: 'Month over month', quarterly: 'Quarter over quarter', yearly: 'Year over year' };

/** Revenue bars (green = grew, red = shrank vs previous bucket) with the growth-rate line. */
export default function GrowthChart({ interval = 'monthly', height = 300, className }) {
  const q = useSalesGrowth(interval);
  return (
    <GlassCard title="Growth" subtitle={LABEL[interval] ?? 'Growth rate'} icon={BarChart3} className={className}>
      <QueryState query={q} height={height}>
        {(rows) => (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={rows} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} minTickGap={16} />
                <YAxis yAxisId="rev" {...axisProps} width={58} tickFormatter={(v) => fmtMoney(v)} />
                <YAxis yAxisId="growth" orientation="right" {...axisProps} width={48} tickFormatter={(v) => fmtPct(v, { digits: 0, sign: true })} />
                <Tooltip content={<ChartTooltip format={fmt} />} cursor={{ fill: 'rgb(var(--line) / 0.05)' }} />
                <Legend iconType="circle" iconSize={8} formatter={legendText} />
                <ReferenceLine yAxisId="growth" y={0} stroke={C.fg3} strokeOpacity={0.35} />
                <Bar yAxisId="rev" dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {rows.map((r) => <Cell key={r.period} fill={barColor(r.growthRate)} fillOpacity={0.7} />)}
                </Bar>
                <Line yAxisId="growth" type="monotone" dataKey="growthRate" name="Growth" stroke={C.violet} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: C.violet }} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </QueryState>
    </GlassCard>
  );
}
