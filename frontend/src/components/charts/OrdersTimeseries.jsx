import { useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ChartSkeleton, EmptyState, ErrorState, GlassCard, Segmented } from '../ui/index.js';
import { useSalesTimeseries } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { C, animation, axisProps, gridProps } from './theme.js';
import ChartTooltip from './ChartTooltip.jsx';

const INTERVALS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];
const HEIGHT = 280;

/** Orders per bucket (bars) with average order value (line). Owns its interval state. */
export default function OrdersTimeseries({ defaultInterval = 'weekly', className }) {
  const [bucket, setBucket] = useState(defaultInterval);
  const { data, isPending, isError, error, refetch } = useSalesTimeseries(bucket);
  const rows = data ?? [];

  let body;
  if (isPending) body = <ChartSkeleton height={HEIGHT} bars={24} />;
  else if (isError) body = <Frame><ErrorState error={error} retry={refetch} /></Frame>;
  else if (rows.length === 0) body = <Frame><EmptyState title="No orders in this range" body="Try a wider date range from the top bar." /></Frame>;
  else {
    body = (
      <div style={{ height: HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={28} />
            <YAxis yAxisId="left" {...axisProps} width={44} allowDecimals={false} tickFormatter={(v) => fmtNumber(v, { compact: true })} />
            <YAxis yAxisId="right" orientation="right" {...axisProps} width={60} tickFormatter={(v) => fmtMoney(v)} />
            <Tooltip
              cursor={{ fill: 'rgb(var(--line) / 0.05)' }}
              content={<ChartTooltip format={(v, name) => (name === 'AOV' ? fmtMoney(v, { full: true }) : fmtNumber(v))} />}
            />
            <Bar yAxisId="left" dataKey="orders" name="Orders" fill={C.primary} radius={[6, 6, 0, 0]} maxBarSize={36} {...animation} />
            <Line yAxisId="right" type="monotone" dataKey="aov" name="AOV" stroke={C.teal} strokeWidth={2} dot={false} activeDot={{ r: 4 }} {...animation} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <GlassCard
      className={`min-h-[360px] ${className ?? ''}`}
      icon={BarChart3}
      title="Orders over time"
      subtitle="Orders per bucket with average order value"
      action={
        <div className="flex items-center gap-3">
          <ul className="hidden items-center gap-3 text-[11px] text-fg-3 sm:flex" aria-hidden="true">
            <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: C.primary }} />Orders</li>
            <li className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full" style={{ background: C.teal }} />AOV</li>
          </ul>
          <Segmented size="xs" options={INTERVALS} value={bucket} onChange={setBucket} />
        </div>
      }
    >
      {body}
    </GlassCard>
  );
}

function Frame({ children }) {
  return <div className="grid place-items-center" style={{ height: HEIGHT }}>{children}</div>;
}
