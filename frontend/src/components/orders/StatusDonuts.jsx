import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { EmptyState, ErrorState, GlassCard, Skeleton } from '../ui/index.js';
import { useOrderStatus } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber, fmtPct } from '../../lib/format.js';
import { C, SERIES, animation } from '../charts/theme.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';

const TONE = {
  paid: C.success, fulfilled: C.success, delivered: C.success,
  pending: C.warning, unfulfilled: C.warning, authorized: C.primary,
  partial: C.violet, partially_paid: C.violet, partially_refunded: C.pink,
  refunded: C.danger, voided: C.fg3, cancelled: C.danger, restocked: C.pink,
};
const SIZE = 118;
const pretty = (s = '') => s.replace(/_/g, ' ');

/** Two compact donuts: financial status (count + revenue) and fulfillment status. */
export default function StatusDonuts({ className }) {
  const { data, isPending, isError, error, refetch } = useOrderStatus();
  const financial = data?.financial ?? [];
  const fulfillment = data?.fulfillment ?? [];
  const empty = !isPending && !isError && financial.length === 0 && fulfillment.length === 0;

  let body;
  if (isPending) body = <div className="flex flex-col gap-6"><DonutSkeleton /><DonutSkeleton /></div>;
  else if (isError) body = <ErrorState error={error} retry={refetch} />;
  else if (empty) body = <EmptyState title="No status data" body="Nothing to break down for this range." />;
  else {
    body = (
      <div className="flex flex-col gap-6">
        <Donut title="Financial" items={financial} extra={(d) => fmtMoney(d.revenue)} />
        <Donut title="Fulfillment" items={fulfillment} />
      </div>
    );
  }

  return (
    <GlassCard className={`min-h-[300px] ${className ?? ''}`} icon={PieIcon} title="Status mix" subtitle="Financial and fulfillment breakdown">
      {body}
    </GlassCard>
  );
}

function Donut({ title, items, extra }) {
  const total = items.reduce((s, it) => s + (it.count || 0), 0);
  const data = items.map((it, i) => ({ ...it, name: pretty(it.status), color: TONE[it.status] || SERIES[i % SERIES.length] }));
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="name" innerRadius="64%" outerRadius="100%" paddingAngle={2} stroke="none" {...animation}>
                {data.map((d) => <Cell key={d.status} fill={d.color} />)}
              </Pie>
              <Tooltip
                content={<ChartTooltip format={(v) => `${fmtNumber(v)} · ${fmtPct(total ? (v / total) * 100 : 0)}`} labelFormat={(_, p) => <span className="capitalize">{p?.[0]?.name}</span>} />}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="tabular font-display text-base font-semibold leading-none text-fg">{fmtNumber(total, { compact: true })}</p>
              <p className="mt-0.5 text-[10px] text-fg-3">orders</p>
            </div>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
          {data.slice(0, 5).map((d) => (
            <li key={d.status} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="min-w-0 flex-1 truncate capitalize text-fg-2">{d.name}</span>
              {extra && <span className="tabular hidden text-fg-3 sm:inline">{extra(d)}</span>}
              <span className="tabular w-12 text-right font-medium text-fg">{fmtPct(total ? (d.count / total) * 100 : 0)}</span>
            </li>
          ))}
          {data.length > 5 && <li className="text-[11px] text-fg-3">+{data.length - 5} more</li>}
        </ul>
      </div>
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 h-3 w-20" />
      <div className="flex items-center gap-4">
        <Skeleton className="shrink-0 rounded-full" style={{ width: SIZE, height: SIZE }} />
        <div className="flex-1 space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3" style={{ width: `${90 - i * 15}%` }} />)}
        </div>
      </div>
    </div>
  );
}
