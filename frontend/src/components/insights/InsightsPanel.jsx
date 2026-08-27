import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Sparkles } from 'lucide-react';
import { useInsights } from '../../hooks/useApi.js';
import { timeAgo } from '../../lib/format.js';
import { Skeleton } from '../ui/Skeleton.jsx';
import EmptyState, { ErrorState } from '../ui/EmptyState.jsx';
import InsightCard from './InsightCard.jsx';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'positive', label: 'Positive', dot: 'bg-success' },
  { value: 'negative', label: 'Negative', dot: 'bg-danger' },
  { value: 'alert', label: 'Alerts', dot: 'bg-warning' },
];

/**
 * Auto-generated insights list. Props: { limit = 6, compact = false }
 */
export default function InsightsPanel({ limit = 6, compact = false }) {
  const { data, isPending, isError, error, refetch, dataUpdatedAt } = useInsights();
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => {
    const c = { all: data?.length ?? 0, positive: 0, negative: 0, alert: 0 };
    (data || []).forEach((i) => { if (c[i.type] != null) c[i.type] += 1; });
    return c;
  }, [data]);

  const rows = useMemo(() => {
    const list = (data || []).filter((i) => filter === 'all' || i.type === filter);
    return list.slice(0, limit);
  }, [data, filter, limit]);

  const cardH = compact ? 72 : 112;

  return (
    <div className="flex flex-col gap-3" aria-busy={isPending}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] text-fg-3">
          <Sparkles size={12} className="text-primary" />
          Auto-generated
          <span aria-hidden="true">·</span>
          {isPending ? 'analysing…' : `updated ${dataUpdatedAt ? timeAgo(dataUpdatedAt) : 'just now'}`}
        </p>
        <div className="flex items-center gap-1" role="tablist" aria-label="Filter insights">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={clsx(
                'pill !px-2.5 !py-1 transition-colors',
                filter === f.value ? 'bg-primary/15 text-primary' : 'bg-line/5 text-fg-3 hover:bg-line/10 hover:text-fg-2',
              )}
            >
              {f.dot && <span className={clsx('h-1.5 w-1.5 rounded-full', f.dot)} aria-hidden="true" />}
              {f.label}
              {!isPending && <span className="ml-0.5 font-normal opacity-70">{counts[f.value]}</span>}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: Math.min(limit, 4) }).map((_, i) => (
            <Skeleton key={i} className="w-full rounded-2xl" style={{ height: cardH }} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} retry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Sparkles} title="No insights for this filter" body="Try a wider date range or another filter." />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((insight, i) => (
            <InsightCard key={insight.id ?? i} insight={insight} index={i} compact={compact} typewriter={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
