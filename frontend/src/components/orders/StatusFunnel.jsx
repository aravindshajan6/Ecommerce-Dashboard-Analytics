import { Fragment, useEffect, useRef } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { EmptyState, ErrorState, GlassCard, Skeleton } from '../ui/index.js';
import { useOrderStatus } from '../../hooks/useApi.js';
import { useCountUp } from '../../hooks/useAnime.js';
import { animate, prefersReducedMotion, stagger } from '../../lib/motion.js';
import { fmtNumber, fmtPct } from '../../lib/format.js';

const STAGES = [
  { key: 'placed', label: 'Placed', from: 'rgb(var(--primary))', to: 'rgb(var(--violet))' },
  { key: 'paid', label: 'Paid', from: 'rgb(var(--violet))', to: 'rgb(var(--pink))' },
  { key: 'fulfilled', label: 'Fulfilled', from: 'rgb(var(--teal))', to: 'rgb(var(--primary))' },
  { key: 'delivered', label: 'Delivered', from: 'rgb(var(--success))', to: 'rgb(var(--teal))' },
];

const pct = (n, d) => (d ? (n / d) * 100 : 0);

/** placed → paid → fulfilled → delivered. Bars are centred so the silhouette reads as a funnel. */
export default function StatusFunnel({ className }) {
  const { data, isPending, isError, error, refetch } = useOrderStatus();
  const rootRef = useRef(null);

  const stages = STAGES.map((s) => ({ ...s, count: data?.funnel?.find((f) => f.stage === s.key)?.count ?? 0 }));
  const max = Math.max(...stages.map((s) => s.count), 0);
  const overall = pct(stages[3].count, stages[0].count);
  const empty = !isPending && !isError && max === 0;

  // Animate bar widths whenever the data changes (from their current width, so range switches morph).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !data) return undefined;
    const bars = [...root.querySelectorAll('[data-width]')];
    if (bars.length === 0) return undefined;
    if (prefersReducedMotion()) {
      bars.forEach((b) => { b.style.width = `${b.dataset.width}%`; });
      return undefined;
    }
    const anim = animate(bars, { width: (el) => `${el.dataset.width}%`, duration: 900, delay: stagger(80), ease: 'outExpo' });
    return () => anim.pause();
  }, [data]);

  let body;
  if (isPending) {
    body = (
      <div className="flex flex-col gap-3 py-1">
        {STAGES.map((s) => (
          <div key={s.key} className="grid grid-cols-[84px_1fr_56px] items-center gap-3">
            <Skeleton className="h-3 w-16" /><Skeleton className="h-9" /><Skeleton className="h-4 w-12 justify-self-end" />
          </div>
        ))}
      </div>
    );
  } else if (isError) body = <ErrorState error={error} retry={refetch} />;
  else if (empty) body = <EmptyState title="No orders in this range" body="The funnel fills in once orders exist for the selected period." />;
  else {
    body = (
      <div ref={rootRef} className="flex flex-col gap-1.5">
        {stages.map((s, i) => (
          <Fragment key={s.key}>
            {i > 0 && (
              <div className="grid grid-cols-[84px_1fr_56px] items-center gap-3" aria-label={`${fmtPct(pct(s.count, stages[i - 1].count))} of ${stages[i - 1].label} reach ${s.label}`}>
                <span />
                <div className="flex justify-center">
                  <span className="pill bg-line/10 text-fg-2"><ChevronDown size={11} className="text-fg-3" />{fmtPct(pct(s.count, stages[i - 1].count))}</span>
                </div>
                <span />
              </div>
            )}
            <div className="grid grid-cols-[84px_1fr_56px] items-center gap-3">
              <span className="text-xs font-medium text-fg-2">{s.label}</span>
              <div className="flex h-9 justify-center overflow-hidden rounded-lg bg-line/5">
                <div
                  className="h-full rounded-lg"
                  data-width={max ? ((s.count / max) * 100).toFixed(2) : 0}
                  style={{ width: '0%', background: `linear-gradient(90deg, ${s.from}, ${s.to})`, boxShadow: `0 0 24px -6px ${s.from}` }}
                />
              </div>
              <StageCount value={s.count} />
            </div>
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <GlassCard
      className={`min-h-[300px] ${className ?? ''}`}
      icon={Filter}
      title="Status funnel"
      subtitle="Placed → paid → fulfilled → delivered"
      action={!isPending && !isError && !empty ? (
        <span className="pill bg-success/15 text-success" title="Placed orders that reached delivered">{fmtPct(overall)} end-to-end</span>
      ) : null}
    >
      {body}
    </GlassCard>
  );
}

function StageCount({ value }) {
  const ref = useCountUp(value, { format: (v) => fmtNumber(Math.round(v)), duration: 1000 });
  return <span ref={ref} className="tabular text-right font-display text-sm font-semibold text-fg">{fmtNumber(value)}</span>;
}
