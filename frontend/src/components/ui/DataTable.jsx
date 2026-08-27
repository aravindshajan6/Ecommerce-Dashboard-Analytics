import clsx from 'clsx';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { TableSkeleton } from './Skeleton.jsx';
import EmptyState from './EmptyState.jsx';
import { useReveal } from '../../hooks/useAnime.js';

/**
 * Generic sortable/paginated table.
 * columns: [{ key, header, render?(row), sortable?, align?: 'right', width? }]
 * sort: "field:asc|desc"; onSort(field)
 * pagination: { page, pages, total, limit, onPage }
 */
export default function DataTable({ columns, rows = [], loading, sort, onSort, pagination, rowKey = (r) => r.id, onRowClick, dense = false, emptyTitle }) {
  const [sortField, sortDir] = (sort || '').split(':');
  const ready = !loading && rows.length > 0;
  const bodyRef = useReveal(ready, { selector: 'tr', each: 30, y: 8, duration: 500 });

  return (
    <div className="flex flex-col gap-3">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width }} className={clsx(c.align === 'right' && 'text-right')}>
                  {c.sortable && onSort ? (
                    <button onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 hover:text-fg transition-colors">
                      {c.header}
                      {sortField === c.key ? (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ChevronsUpDown size={11} className="opacity-50" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          {loading ? (
            <tbody><tr><td colSpan={columns.length}><TableSkeleton cols={columns.length} /></td></tr></tbody>
          ) : rows.length === 0 ? (
            <tbody><tr><td colSpan={columns.length}><EmptyState title={emptyTitle} /></td></tr></tbody>
          ) : (
            <tbody ref={bodyRef}>
              {rows.map((r) => (
                <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={clsx(onRowClick && 'cursor-pointer', dense && '[&>td]:py-2')}>
                  {columns.map((c) => (
                    <td key={c.key} className={clsx(c.align === 'right' && 'text-right tabular', c.className)}>
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-xs text-fg-3">
          <span>
            {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button className="btn-ghost !px-2 !py-1" disabled={pagination.page <= 1} onClick={() => pagination.onPage(pagination.page - 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>
            <span className="tabular px-2 text-fg-2">{pagination.page} / {pagination.pages}</span>
            <button className="btn-ghost !px-2 !py-1" disabled={pagination.page >= pagination.pages} onClick={() => pagination.onPage(pagination.page + 1)} aria-label="Next page"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
