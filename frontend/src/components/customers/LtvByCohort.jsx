import { useId, useMemo } from 'react';
import clsx from 'clsx';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Layers } from 'lucide-react';
import { GlassCard, ChartSkeleton, ErrorState, EmptyState } from '../ui/index.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import { C, axisProps, gridProps, animation } from '../charts/theme.js';
import { useCohorts } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';

const H = 340;

export default function LtvByCohort({ months = 12, className }) {
  const { data, isPending, error, refetch } = useCohorts(months);
  const id = useId();
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const fmt = (v, name) => (name === 'Customers' ? fmtNumber(v) : fmtMoney(v, { full: true }));

  return (
    <GlassCard title="Lifetime value by cohort" subtitle="Revenue per customer vs cohort size" icon={Layers} className={clsx('min-h-[420px]', className)}>
      {isPending ? (
        <ChartSkeleton height={H} bars={12} />
      ) : error ? (
        <div className="grid place-items-center" style={{ height: H }}><ErrorState error={error} retry={refetch} /></div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center" style={{ height: H }}><EmptyState title="No cohorts yet" /></div>
      ) : (
        <div style={{ height: H }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`${id}-ltv`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={C.primary} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={C.violet} stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} minTickGap={16} />
              <YAxis yAxisId="ltv" {...axisProps} width={56} tickFormatter={(v) => fmtMoney(v)} />
              <YAxis yAxisId="cust" orientation="right" {...axisProps} width={40} tickFormatter={(v) => fmtNumber(v, { compact: true })} allowDecimals={false} />
              <Tooltip content={<ChartTooltip format={fmt} />} cursor={{ fill: 'rgb(var(--line) / 0.05)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar yAxisId="ltv" dataKey="ltv" name="LTV per customer" fill={`url(#${id}-ltv)`} radius={[6, 6, 0, 0]} maxBarSize={36} {...animation} />
              <Line yAxisId="cust" type="monotone" dataKey="customers" name="Customers" stroke={C.teal} strokeWidth={2} dot={{ r: 3, fill: C.teal, strokeWidth: 0 }} activeDot={{ r: 5 }} {...animation} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
