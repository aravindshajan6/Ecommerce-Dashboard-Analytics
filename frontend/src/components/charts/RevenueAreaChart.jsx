import { useId, useMemo } from 'react';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { GlassCard, Segmented } from '../ui/index.js';
import { useSalesTimeseries } from '../../hooks/useApi.js';
import { INTERVALS } from '../../lib/range.jsx';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { C, axisProps, gridProps } from './theme.js';
import ChartTooltip from './ChartTooltip.jsx';
import QueryState from './QueryState.jsx';
import { movingAverage, svgId } from './series.js';

const fmt = (v, name) => (name === 'Orders' ? fmtNumber(v) : fmtMoney(v, { full: true }));
const legendText = (value) => <span className="text-xs text-fg-2">{value}</span>;

/**
 * Revenue area (left axis) + orders line (right axis). `movingAvg` adds a dashed 7-bucket trailing average;
 * `ghost` (optional array aligned by index, e.g. previous period) draws a dashed grey line.
 */
export default function RevenueAreaChart({
  interval, onInterval, intervals = INTERVALS.slice(0, 3), movingAvg = false, ghost, showOrders = true,
  height = 300, className, title = 'Revenue', subtitle = 'Revenue and order volume over time',
}) {
  const q = useSalesTimeseries(interval);
  const gid = svgId(useId());
  const rows = useMemo(() => {
    let r = q.data ?? [];
    if (movingAvg) r = movingAverage(r, { window: 7 });
    if (ghost) r = r.map((x, i) => ({ ...x, ghost: ghost[i]?.revenue ?? null }));
    return r;
  }, [q.data, movingAvg, ghost]);

  return (
    <GlassCard title={title} subtitle={subtitle} icon={TrendingUp} className={className}
      action={onInterval && <Segmented size="xs" options={intervals} value={interval} onChange={onInterval} />}>
      <QueryState query={q} height={height}>
        {() => (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={rows} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.primary} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={C.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} minTickGap={28} />
                <YAxis yAxisId="rev" {...axisProps} width={58} tickFormatter={(v) => fmtMoney(v)} />
                {showOrders && <YAxis yAxisId="ord" orientation="right" {...axisProps} width={40} tickFormatter={(v) => fmtNumber(v, { compact: true })} />}
                <Tooltip content={<ChartTooltip format={fmt} />} cursor={{ stroke: C.fg3, strokeOpacity: 0.3 }} />
                <Legend iconType="circle" iconSize={8} formatter={legendText} />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke={C.primary} strokeWidth={2} fill={`url(#${gid})`} activeDot={{ r: 4, strokeWidth: 0 }} />
                {ghost && <Line yAxisId="rev" type="monotone" dataKey="ghost" name="Previous period" stroke={C.fg3} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />}
                {movingAvg && <Line yAxisId="rev" type="monotone" dataKey="movingAvg" name="Moving avg" stroke={C.pink} strokeWidth={1.5} strokeDasharray="6 4" dot={false} />}
                {showOrders && <Line yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke={C.teal} strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </QueryState>
    </GlassCard>
  );
}
