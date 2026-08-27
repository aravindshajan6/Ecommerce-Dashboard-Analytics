import { useId, useMemo } from 'react';
import clsx from 'clsx';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users } from 'lucide-react';
import { GlassCard, ChartSkeleton, ErrorState, EmptyState } from '../ui/index.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import { C, axisProps, gridProps, animation } from '../charts/theme.js';
import { useNewCustomers, useRepeatCustomers } from '../../hooks/useApi.js';
import { fmtNumber, fmtPct } from '../../lib/format.js';

const H = 320;

/** Merge /customers/new and /customers/repeat by `period`. */
function merge(fresh, rep) {
  const map = new Map();
  (Array.isArray(fresh) ? fresh : []).forEach((d) => {
    map.set(d.period, { period: d.period, label: d.label ?? d.period, newCustomers: d.count ?? 0, repeat: 0, repeatRate: null });
  });
  (Array.isArray(rep) ? rep : []).forEach((d) => {
    const m = map.get(d.period) || { period: d.period, label: d.label ?? d.period, newCustomers: 0, repeat: 0, repeatRate: null };
    m.repeat = d.repeatCustomers ?? 0;
    m.repeatRate = d.repeatRate != null ? d.repeatRate * 100 : null;
    map.set(d.period, m);
  });
  return [...map.values()].sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
}

export default function NewVsRepeat({ interval = 'monthly', className }) {
  const fresh = useNewCustomers(interval);
  const rep = useRepeatCustomers(interval);
  const id = useId();
  const data = useMemo(() => merge(fresh.data, rep.data), [fresh.data, rep.data]);
  const loading = fresh.isPending || rep.isPending;
  const error = fresh.error || rep.error;
  const retry = () => { fresh.refetch(); rep.refetch(); };
  const fmt = (v, name) => (name === 'Repeat rate' ? fmtPct(v) : fmtNumber(v));

  return (
    <GlassCard title="New vs repeat customers" subtitle="Stacked per period · repeat rate on the right axis" icon={Users} className={clsx('min-h-[400px]', className)}>
      {loading ? (
        <ChartSkeleton height={H} />
      ) : error ? (
        <div className="grid place-items-center" style={{ height: H }}><ErrorState error={error} retry={retry} /></div>
      ) : data.length === 0 ? (
        <div className="grid place-items-center" style={{ height: H }}><EmptyState title="No customer activity in this range" /></div>
      ) : (
        <div style={{ height: H }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`${id}-new`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={C.primary} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={C.primary} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id={`${id}-rep`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={C.teal} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={C.teal} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} minTickGap={28} interval="preserveStartEnd" />
              <YAxis yAxisId="left" {...axisProps} width={44} tickFormatter={(v) => fmtNumber(v, { compact: true })} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" {...axisProps} width={40} domain={[0, 100]} tickFormatter={(v) => `${Math.round(v)}%`} />
              <Tooltip content={<ChartTooltip format={fmt} />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area yAxisId="left" type="monotone" dataKey="newCustomers" name="New customers" stackId="c" stroke={C.primary} strokeWidth={2} fill={`url(#${id}-new)`} {...animation} />
              <Area yAxisId="left" type="monotone" dataKey="repeat" name="Repeat customers" stackId="c" stroke={C.teal} strokeWidth={2} fill={`url(#${id}-rep)`} {...animation} />
              <Line yAxisId="right" type="monotone" dataKey="repeatRate" name="Repeat rate" stroke={C.pink} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls {...animation} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
