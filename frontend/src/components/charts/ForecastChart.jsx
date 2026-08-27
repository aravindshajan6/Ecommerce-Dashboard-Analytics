import { useId, useMemo } from 'react';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Sparkles } from 'lucide-react';
import { Badge, GlassCard, Segmented } from '../ui/index.js';
import { useSalesForecast } from '../../hooks/useApi.js';
import { fmtMoney } from '../../lib/format.js';
import { C, axisProps, gridProps } from './theme.js';
import ChartTooltip from './ChartTooltip.jsx';
import QueryState from './QueryState.jsx';
import { periodLabel, svgId } from './series.js';

const MONTHS = [3, 6, 12].map((m) => ({ value: m, label: `${m}m` }));
const fmt = (v) => (Array.isArray(v) ? `${fmtMoney(v[0])} – ${fmtMoney(v[1])}` : fmtMoney(v, { full: true }));
const legendText = (value) => <span className="text-xs text-fg-2">{value}</span>;
const isEmpty = (d) => !d || (!d.history?.length && !d.forecast?.length);

/** History area + dashed forecast line with a shaded confidence band. */
export default function ForecastChart({ months = 6, onMonths, height = 300, className }) {
  const q = useSalesForecast(months);
  const gid = svgId(useId());
  const { rows, nowLabel } = useMemo(() => {
    const history = (q.data?.history ?? []).map((p) => ({ label: periodLabel(p.period), revenue: p.revenue }));
    const last = history[history.length - 1];
    if (last) { last.forecast = last.revenue; last.band = [last.revenue, last.revenue]; }
    const forecast = (q.data?.forecast ?? []).map((p) => ({ label: periodLabel(p.period), forecast: p.revenue, band: [p.lower, p.upper] }));
    return { rows: [...history, ...forecast], nowLabel: last?.label };
  }, [q.data]);

  return (
    <GlassCard
      title={<span className="inline-flex items-center gap-2">Forecast <Badge className="!bg-violet/15 !text-violet">Projection</Badge></span>}
      subtitle="Holt linear trend + seasonal naive" icon={Sparkles} className={className}
      action={onMonths && <Segmented size="xs" options={MONTHS} value={months} onChange={onMonths} />}
    >
      <QueryState query={q} height={height} isEmpty={isEmpty}>
        {() => (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.primary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} minTickGap={20} />
                <YAxis {...axisProps} width={58} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip content={<ChartTooltip format={fmt} />} cursor={{ stroke: C.fg3, strokeOpacity: 0.3 }} />
                <Legend iconType="circle" iconSize={8} formatter={legendText} />
                <Area type="monotone" dataKey="band" name="Confidence" stroke="none" fill={C.violet} fillOpacity={0.16} activeDot={false} />
                <Area type="monotone" dataKey="revenue" name="Actual" stroke={C.primary} strokeWidth={2} fill={`url(#${gid})`} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke={C.violet} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                {nowLabel && <ReferenceLine x={nowLabel} stroke={C.fg3} strokeOpacity={0.5} strokeDasharray="3 3" label={{ value: 'Now', fill: C.fg3, fontSize: 10, position: 'insideTopLeft' }} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </QueryState>
    </GlassCard>
  );
}
