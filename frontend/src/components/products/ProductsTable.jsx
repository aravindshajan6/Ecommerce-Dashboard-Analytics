import { useMemo } from 'react';
import { Badge, DataTable, Sparkline } from '../ui/index.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { nextSort } from '../orders/constants.js';

const trendColor = (t = []) => (t.length > 1 && t[t.length - 1] < t[0] ? 'rgb(var(--pink))' : 'rgb(var(--teal))');

export default function ProductsTable({ rows = [], loading, sort, onSortChange, pagination, emptyTitle }) {
  const columns = useMemo(() => [
    {
      key: 'title', header: 'Product', sortable: true,
      render: (r) => (
        <span className="flex min-w-0 max-w-[280px] flex-col gap-1">
          <span className="truncate font-medium text-fg" title={r.title}>{r.title}</span>
          <span className="flex items-center gap-1.5 text-[11px] text-fg-3">
            {r.category && <Badge tone="category" className="!py-0">{r.category}</Badge>}
            {r.vendor && <span className="truncate">{r.vendor}</span>}
          </span>
        </span>
      ),
    },
    { key: 'price', header: 'Price', sortable: true, align: 'right', render: (r) => fmtMoney(r.price, { full: true }) },
    {
      key: 'stock', header: 'Stock', sortable: true, align: 'right',
      render: (r) => (
        <span className="inline-flex items-center justify-end gap-2">
          <span className="tabular">{fmtNumber(r.stock)}</span>
          <Badge>{r.status || (r.stock <= 0 ? 'out' : r.stock < 10 ? 'low' : 'healthy')}</Badge>
        </span>
      ),
    },
    { key: 'units', header: 'Units', sortable: true, align: 'right', render: (r) => fmtNumber(r.units) },
    { key: 'orders', header: 'Orders', sortable: true, align: 'right', render: (r) => fmtNumber(r.orders) },
    { key: 'revenue', header: 'Revenue', sortable: true, align: 'right', render: (r) => <span className="font-medium text-fg">{fmtMoney(r.revenue, { full: true })}</span> },
    { key: 'trend', header: 'Trend', width: 110, render: (r) => <Sparkline data={r.trend} width={90} height={28} color={trendColor(r.trend)} /> },
  ], []);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      sort={sort}
      onSort={(field) => onSortChange(nextSort(sort, field))}
      pagination={pagination}
      emptyTitle={emptyTitle ?? 'No products match these filters'}
    />
  );
}
