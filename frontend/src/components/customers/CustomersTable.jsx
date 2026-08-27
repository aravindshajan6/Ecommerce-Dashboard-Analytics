import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import { DataTable, Avatar, ErrorState } from '../ui/index.js';
import { useCustomers } from '../../hooks/useApi.js';
import { fmtDate, fmtMoney, fmtNumber, timeAgo } from '../../lib/format.js';
import SegmentBadge from './SegmentBadge.jsx';
import { useCustomersParams } from './useCustomersParams.js';

const COLUMNS = [
  {
    key: 'name', header: 'Customer', sortable: true,
    render: (r) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={r.name} size={30} />
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{r.name || 'Unknown'}</p>
          <p className="truncate text-xs text-fg-3">{r.email}</p>
        </div>
      </div>
    ),
  },
  { key: 'createdAt', header: 'Joined', sortable: true, render: (r) => <span className="text-fg-2">{fmtDate(r.createdAt)}</span> },
  { key: 'city', header: 'Location', render: (r) => <span className="text-fg-2">{[r.city, r.country].filter(Boolean).join(', ') || '—'}</span> },
  { key: 'orders', header: 'Orders', sortable: true, align: 'right', render: (r) => fmtNumber(r.orders) },
  { key: 'totalSpent', header: 'Total spent', sortable: true, align: 'right', render: (r) => <span className="font-medium text-fg">{fmtMoney(r.totalSpent, { full: true })}</span> },
  { key: 'aov', header: 'AOV', sortable: true, align: 'right', render: (r) => <span className="text-fg-2">{fmtMoney(r.aov, { full: true })}</span> },
  { key: 'lastOrderAt', header: 'Last order', sortable: true, render: (r) => <span className="text-fg-2">{r.lastOrderAt ? timeAgo(r.lastOrderAt) : '—'}</span> },
  { key: 'segment', header: 'Segment', render: (r) => <SegmentBadge segment={r.segment} /> },
];

export default function CustomersTable() {
  const { params, search, sort, setSearch, setPage, toggleSort } = useCustomersParams();
  const { data, isPending, isFetching, error, refetch } = useCustomers(params);
  const [text, setText] = useState(search);

  // Debounce typing → URL (?q=)
  useEffect(() => {
    if (text === search) return undefined;
    const t = setTimeout(() => setSearch(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text, search, setSearch]);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const pagination = data ? { page: data.page ?? params.page, pages: data.pages ?? 1, total: data.total ?? rows.length, limit: data.limit ?? params.limit, onPage: setPage } : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            className="input !pl-8 !pr-8"
            placeholder="Search name, email or city…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Search customers"
          />
          {text && (
            <button type="button" onClick={() => setText('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-fg-3 hover:text-fg" aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>
        <p className="text-xs tabular text-fg-3">
          {isPending ? 'Loading…' : error ? '' : `${fmtNumber(data?.total ?? rows.length)} customers${search ? ` matching “${search}”` : ''}`}
          {isFetching && !isPending && <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary align-middle" />}
        </p>
      </div>
      {error && !data ? (
        <ErrorState error={error} retry={refetch} />
      ) : (
        <div className={clsx('transition-opacity', isFetching && !isPending && 'opacity-60')}>
          <DataTable
            columns={COLUMNS}
            rows={rows}
            loading={isPending}
            sort={sort}
            onSort={toggleSort}
            pagination={pagination}
            emptyTitle={search ? `No customers match “${search}”` : 'No customers yet'}
          />
        </div>
      )}
    </div>
  );
}
