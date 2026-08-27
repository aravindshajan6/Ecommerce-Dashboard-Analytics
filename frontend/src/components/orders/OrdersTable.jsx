import { useMemo } from 'react';
import { Avatar, Badge, DataTable } from '../ui/index.js';
import { fmtDateTime, fmtMoney, fmtNumber } from '../../lib/format.js';
import { nextSort, orderNo } from './constants.js';

export default function OrdersTable({ rows = [], loading, sort, onSortChange, pagination, onRowClick }) {
  const columns = useMemo(() => [
    { key: 'orderNumber', header: 'Order', sortable: true, render: (r) => <span className="font-mono text-xs text-fg">{orderNo(r.orderNumber)}</span> },
    {
      key: 'customer', header: 'Customer',
      render: (r) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={r.customer?.name} size={28} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium text-fg">{r.customer?.name || 'Guest'}</span>
            {r.customer?.email && <span className="truncate text-[11px] text-fg-3">{r.customer.email}</span>}
          </span>
        </span>
      ),
    },
    { key: 'createdAt', header: 'Date', sortable: true, render: (r) => <span className="text-fg-2">{fmtDateTime(r.createdAt)}</span> },
    { key: 'itemCount', header: 'Items', sortable: true, align: 'right', render: (r) => fmtNumber(r.itemCount) },
    { key: 'total', header: 'Total', sortable: true, align: 'right', render: (r) => <span className="font-medium text-fg">{fmtMoney(r.total, { full: true })}</span> },
    { key: 'financialStatus', header: 'Payment', sortable: true, render: (r) => <Badge>{r.financialStatus || 'unknown'}</Badge> },
    { key: 'fulfillmentStatus', header: 'Fulfillment', sortable: true, render: (r) => <Badge>{r.fulfillmentStatus || 'unfulfilled'}</Badge> },
    { key: 'channel', header: 'Channel', sortable: true, render: (r) => <Badge>{r.channel || 'web'}</Badge> },
    { key: 'city', header: 'City', sortable: true, render: (r) => <span className="text-fg-2" title={r.country}>{r.city || '—'}</span> },
  ], []);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      sort={sort}
      onSort={(field) => onSortChange(nextSort(sort, field))}
      pagination={pagination}
      onRowClick={onRowClick}
      emptyTitle="No orders match these filters"
    />
  );
}
