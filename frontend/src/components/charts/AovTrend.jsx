import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Receipt } from 'lucide-react';
import { DeltaPill, GlassCard } from '../ui/index.js';
import { useSalesTimeseries } from '../../hooks/useApi.js';
import { fmtMoney } from '../../lib/format.js';
import { C, axisProps } from './theme.js';
import ChartTooltip from './ChartTooltip.jsx';
import QueryState from './QueryState.jsx';
import { svgId } from './series.js';

/** Small average-order-value trend from the timeseries. */
export default function AovTrend({ interval = 'monthly', height = 150, className }) {
  const q = useSalesTimeseries(interval);
  const gid = svgId(useId());
  const rows = q.data ?? [];
  const last = rows[rows.length - 1]?.aov;
  const first = rows[0]?.aov;
  const delta = first ? ((last - first) / first) * 100 : null;

  return (
    <GlassCard title="Average order value" subtitle={last != null ? `Latest ${fmtMoney(last, { full: true })}` : 'Per order, over time'} icon={Receipt} className={className}
      action={rows.length > 1 && <DeltaPill value={delta} suffix="since start of range" />}>
      <QueryState query={q} height={height}>
        {() => (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={rows} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.teal} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.teal} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" {...axisProps} minTickGap={32} />
                <YAxis {...axisProps} width={52} tickFormatter={(v) => fmtMoney(v)} domain={['auto', 'auto']} />
                <Tooltip content={<ChartTooltip format={(v) => fmtMoney(v, { full: true })} />} cursor={{ stroke: C.fg3, strokeOpacity: 0.3 }} />
                <Area type="monotone" dataKey="aov" name="AOV" stroke={C.teal} strokeWidth={2} fill={`url(#${gid})`} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </QueryState>
    </GlassCard>
  );
}
