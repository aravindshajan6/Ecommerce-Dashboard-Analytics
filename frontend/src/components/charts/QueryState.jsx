import clsx from 'clsx';
import { ChartSkeleton, TableSkeleton, EmptyState, ErrorState } from '../ui/index.js';

const isEmptyDefault = (d) => d == null || (Array.isArray(d) && d.length === 0);

/**
 * Renders loading → same-size skeleton, error → ErrorState (retry), empty → EmptyState, else `children(data)`.
 * Refetches hold the previous render at reduced opacity (no skeleton flash).
 */
export default function QueryState({ query, height = 260, table = false, isEmpty = isEmptyDefault, emptyTitle = 'No data for this range', emptyBody, children }) {
  if (query.isPending) return table ? <TableSkeleton /> : <ChartSkeleton height={height} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => query.refetch()} />;
  if (isEmpty(query.data)) {
    return (
      <div className="grid place-items-center" style={{ minHeight: table ? undefined : height }}>
        <EmptyState title={emptyTitle} body={emptyBody} />
      </div>
    );
  }
  return <div className={clsx('transition-opacity duration-300', query.isFetching && 'opacity-60')}>{children(query.data)}</div>;
}
