import { Crown } from 'lucide-react';
import { Avatar, Badge, DataTable, ErrorState, GlassCard } from '../ui/index.js';
import { useTopCustomers } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';

const SEGMENT_TONE = {
  champions: '!bg-success/15 !text-success', loyal: '!bg-teal/15 !text-teal', 'potential loyalist': '!bg-primary/15 !text-primary',
  new: '!bg-violet/15 !text-violet', promising: '!bg-violet/15 !text-violet', 'need attention': '!bg-warning/15 !text-warning',
  'about to sleep': '!bg-warning/15 !text-warning', 'at risk': '!bg-danger/15 !text-danger', hibernating: '!bg-danger/15 !text-danger', lost: '!bg-danger/15 !text-danger',
};

const COLUMNS = [
  { key: 'name', header: 'Customer', render: (r) => (
    <span className="flex items-center gap-2.5">
      <Avatar name={r.name} size={28} />
      <span className="min-w-0"><span className="block truncate font-medium text-fg">{r.name}</span><span className="block truncate text-[11px] text-fg-3">{r.city || r.email}</span></span>
    </span>
  ) },
  { key: 'orders', header: 'Orders', align: 'right', render: (r) => fmtNumber(r.orders) },
  { key: 'totalSpent', header: 'Spent', align: 'right', render: (r) => <span className="font-semibold">{fmtMoney(r.totalSpent)}</span> },
  { key: 'segment', header: 'Segment', render: (r) => r.segment && <Badge className={SEGMENT_TONE[r.segment.toLowerCase()]}>{r.segment}</Badge> },
];

/** Top customers by total spend. Data: /api/customers/top?limit=6. */
export default function TopCustomersMini({ className, limit = 6 }) {
  const q = useTopCustomers(limit);
  return (
    <GlassCard title="Top customers" subtitle="Highest lifetime spend" icon={Crown} className={className} bodyClassName="!px-2 !pb-3">
      {q.isError ? <ErrorState error={q.error} retry={() => q.refetch()} /> : <DataTable columns={COLUMNS} rows={q.data ?? []} loading={q.isPending} dense emptyTitle="No customers yet" />}
    </GlassCard>
  );
}
