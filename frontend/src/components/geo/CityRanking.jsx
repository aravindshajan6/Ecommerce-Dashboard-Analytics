import { useEffect } from 'react';
import clsx from 'clsx';
import { Trophy, X } from 'lucide-react';
import { GlassCard, ErrorState, EmptyState, Skeleton } from '../ui/index.js';
import { useReveal } from '../../hooks/useAnime.js';
import { fmtMoney, fmtNumber, fmtPct } from '../../lib/format.js';
import { flagEmoji } from './flag.js';

function SelectedCard({ p, onClear }) {
  const flag = flagEmoji(p.countryCode);
  return (
    <div className="glass gradient-border !rounded-2xl p-3.5" style={{ '--glass-alpha': 0.35 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow">#{p.rank} · {flag || p.country}</p>
          <p className="truncate font-display text-lg font-semibold text-fg">{p.city}{flag && p.country ? <span className="text-sm font-normal text-fg-3"> · {p.country}</span> : null}</p>
        </div>
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={onClear}><X size={12} /> Clear</button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-4 xl:grid-cols-2">
        {[
          ['Customers', fmtNumber(p.customers)],
          ['Orders', fmtNumber(p.orders)],
          ['Revenue', fmtMoney(p.revenue)],
          ['Share', fmtPct((p.share ?? 0) * 100)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-fg-3">{k}</dt>
            <dd className="font-display text-base font-semibold tabular text-fg">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2.5" aria-busy="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-5" /><Skeleton className="h-5 w-5" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

/**
 * Ranked city list. Props: { points (ranked, with share/rank), loading, error, retry, selected, onSelect(city|null), className }
 */
export default function CityRanking({ points = [], loading, error, retry, selected = null, onSelect, className }) {
  const max = points[0]?.customers || 1;
  const sel = points.find((p) => p.city === selected);
  const listRef = useReveal(!loading && points.length > 0, { each: Math.max(8, Math.min(40, 900 / Math.max(1, points.length))), y: 8, duration: 500 });

  useEffect(() => {
    if (!selected || !listRef.current) return;
    listRef.current.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected, listRef]);

  return (
    <GlassCard
      title="City ranking"
      subtitle={loading ? 'Loading…' : `${fmtNumber(points.length)} cities by customers`}
      icon={Trophy}
      className={clsx('min-h-[400px] xl:max-h-[632px]', className)}
      bodyClassName="flex min-h-0 flex-col gap-3"
    >
      {sel && <SelectedCard p={sel} onClear={() => onSelect?.(null)} />}
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState error={error} retry={retry} />
      ) : points.length === 0 ? (
        <EmptyState title="No geocoded cities" body="Customer cities are geocoded server-side; unknown cities are counted separately." />
      ) : (
        <ol ref={listRef} className="-mr-2 max-h-[420px] min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-2 xl:max-h-none">
          {points.map((p) => {
            const active = p.city === selected;
            const flag = flagEmoji(p.countryCode);
            return (
              <li key={`${p.city}|${p.country}`} data-active={active}>
                <button
                  type="button"
                  onClick={() => onSelect?.(active ? null : p.city)}
                  aria-pressed={active}
                  className={clsx('w-full rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-line/5', active && 'bg-primary/10 ring-1 ring-primary/40')}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 shrink-0 text-right text-xs tabular text-fg-3">{p.rank}</span>
                    {flag
                      ? <span className="shrink-0 text-base leading-none" aria-label={p.country}>{flag}</span>
                      : <span className="w-8 shrink-0 truncate text-[10px] uppercase tracking-wide text-fg-3">{p.country || '—'}</span>}
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">
                      {p.city}{flag && p.country ? <span className="text-fg-3"> · {p.country}</span> : null}
                    </span>
                    <span className="shrink-0 text-xs tabular text-fg-2">{fmtNumber(p.customers)}</span>
                    <span className="w-12 shrink-0 text-right text-xs tabular text-fg-3">{fmtPct((p.share ?? 0) * 100)}</span>
                  </div>
                  <div className="ml-[30px] mt-1.5 h-1 overflow-hidden rounded-full bg-line/10">
                    <div className={clsx('h-full rounded-full bg-gradient-to-r transition-[width] duration-500', active ? 'from-pink to-violet' : 'from-primary to-teal')} style={{ width: `${Math.max(2, ((p.customers || 0) / max) * 100)}%` }} />
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </GlassCard>
  );
}
