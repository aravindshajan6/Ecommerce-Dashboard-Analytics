import { useMemo } from 'react';
import clsx from 'clsx';
import { Crown, Trophy } from 'lucide-react';
import { GlassCard, Avatar, ErrorState, EmptyState, Skeleton } from '../ui/index.js';
import { useTopCustomers } from '../../hooks/useApi.js';
import { useAnimeScope, useReveal } from '../../hooks/useAnime.js';
import { animate, stagger, utils, prefersReducedMotion } from '../../lib/motion.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';

const LIMIT = 8;

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: LIMIT }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-8 !rounded-full" />
          <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-1.5 w-full" /></div>
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

const RANK_TONE = ['text-warning', 'text-fg-2', 'text-pink'];

export default function TopCustomers({ className }) {
  const { data, isPending, error, refetch } = useTopCustomers(LIMIT);
  const rows = useMemo(() => (Array.isArray(data) ? data : data?.rows ?? []).slice(0, LIMIT), [data]);
  const max = useMemo(() => Math.max(1, ...rows.map((r) => r.totalSpent || 0)), [rows]);

  const listRef = useReveal(!isPending && rows.length > 0, { each: 60, y: 10 });
  const barsRef = useAnimeScope(() => {
    if (rows.length === 0) return;
    if (prefersReducedMotion()) { utils.set('.spend-bar', { scaleX: 1 }); return; }
    animate('.spend-bar', { scaleX: [0, 1], duration: 1000, delay: stagger(70, { start: 200 }), ease: 'outExpo' });
  }, [rows]);

  return (
    <GlassCard title="Top customers" subtitle="By lifetime spend" icon={Trophy} className={clsx('min-h-[400px]', className)}>
      <div ref={barsRef}>
        {isPending ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState error={error} retry={refetch} />
        ) : rows.length === 0 ? (
          <EmptyState title="No customers yet" />
        ) : (
          <ol ref={listRef} className="space-y-2.5">
            {rows.map((r, i) => (
              <li key={r.id ?? `${r.email}-${i}`} className="flex items-center gap-3">
                <span className={clsx('w-5 shrink-0 text-center font-display text-sm font-semibold tabular', RANK_TONE[i] || 'text-fg-3')}>
                  {i === 0 ? <Crown size={15} className="mx-auto" /> : i + 1}
                </span>
                <Avatar name={r.name} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium text-fg">{r.name || 'Unknown'}</p>
                    <p className="shrink-0 font-display text-sm font-semibold tabular text-fg">{fmtMoney(r.totalSpent)}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/10">
                      <div className="spend-bar h-full origin-left rounded-full bg-gradient-to-r from-primary via-violet to-pink" style={{ width: `${Math.max(3, ((r.totalSpent || 0) / max) * 100)}%` }} />
                    </div>
                    <span className="shrink-0 text-[11px] tabular text-fg-3">{fmtNumber(r.orders)} orders</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </GlassCard>
  );
}
