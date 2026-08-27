import { useEffect, useRef } from 'react';
import { AlertTriangle, Warehouse } from 'lucide-react';
import { EmptyState, ErrorState, GlassCard, Skeleton } from '../ui/index.js';
import { useInventory } from '../../hooks/useApi.js';
import { useCountUp, useReveal } from '../../hooks/useAnime.js';
import { animate, prefersReducedMotion, stagger } from '../../lib/motion.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';

const SEGMENTS = [
  { key: 'healthy', label: 'Healthy', color: 'rgb(var(--success))', chip: 'text-success' },
  { key: 'low', label: 'Low', color: 'rgb(var(--warning))', chip: 'text-warning' },
  { key: 'out', label: 'Out', color: 'rgb(var(--danger))', chip: 'text-danger' },
];
const MAX_ALERTS = 6;

const daysTone = (d) => (d == null || !Number.isFinite(d) ? 'bg-line/10 text-fg-3' : d <= 7 ? 'bg-danger/15 text-danger' : d <= 21 ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success');
const daysLabel = (d) => (d == null || !Number.isFinite(d) ? 'no velocity' : d <= 0 ? 'out now' : `${Math.round(d)}d left`);

export default function InventoryPanel({ className }) {
  const { data, isPending, isError, error, refetch } = useInventory();
  const barRef = useRef(null);
  const total = data?.total ?? 0;
  const alerts = (data?.alerts ?? []).slice(0, MAX_ALERTS);

  // Stacked bar segments grow to their share on data change.
  useEffect(() => {
    const root = barRef.current;
    if (!root || !data) return undefined;
    const segs = [...root.querySelectorAll('[data-width]')];
    if (prefersReducedMotion()) { segs.forEach((s) => { s.style.width = `${s.dataset.width}%`; }); return undefined; }
    const anim = animate(segs, { width: (el) => `${el.dataset.width}%`, duration: 900, delay: stagger(100), ease: 'outExpo' });
    return () => anim.pause();
  }, [data]);

  const listRef = useReveal(!!data && alerts.length > 0, { each: 50, y: 8, duration: 500 });

  let body;
  if (isPending) body = <PanelSkeleton />;
  else if (isError) body = <ErrorState error={error} retry={refetch} />;
  else if (!data || total === 0) body = <EmptyState icon={Warehouse} title="No inventory data" body="Stock levels appear once products are loaded." />;
  else {
    body = (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Products" value={total} />
          {SEGMENTS.map((s) => <Stat key={s.key} label={s.label} value={data[s.key] ?? 0} className={s.chip} />)}
        </div>

        <div>
          <div ref={barRef} className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-line/5" role="img" aria-label={SEGMENTS.map((s) => `${s.label} ${fmtNumber(data[s.key] ?? 0)}`).join(', ')}>
            {SEGMENTS.map((s) => (
              <div key={s.key} data-width={total ? (((data[s.key] ?? 0) / total) * 100).toFixed(2) : 0} style={{ width: '0%', background: s.color }} className="h-full rounded-full" />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-fg-3">
            <ul className="flex items-center gap-3">
              {SEGMENTS.map((s) => <li key={s.key} className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />{s.label}</li>)}
            </ul>
            <span>Value <Money value={data.value} /></span>
          </div>
        </div>

        <div>
          <p className="eyebrow mb-2 flex items-center gap-1.5"><AlertTriangle size={11} className="text-warning" /> Stock alerts{data.alerts?.length > MAX_ALERTS ? ` · ${data.alerts.length}` : ''}</p>
          {alerts.length === 0 ? (
            <p className="rounded-xl bg-line/5 px-3 py-3 text-xs text-fg-3">No products are running low. Nice.</p>
          ) : (
            <ul ref={listRef} className="flex flex-col gap-1.5">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line/10 bg-line/5 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg" title={a.title}>{a.title}</p>
                    <p className="text-[11px] text-fg-3">
                      <span className="tabular">{fmtNumber(a.stock)}</span> in stock · <span className="tabular">{fmtNumber(a.velocityPerWeek, { digits: 1 })}</span>/wk velocity
                    </p>
                  </div>
                  <span className={`pill ${daysTone(a.daysLeft)}`}>{daysLabel(a.daysLeft)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <GlassCard className={`min-h-[380px] ${className ?? ''}`} icon={Warehouse} title="Inventory health" subtitle="Stock status across the catalog">
      {body}
    </GlassCard>
  );
}

function Stat({ label, value, className = 'text-fg' }) {
  const ref = useCountUp(value, { format: (v) => fmtNumber(Math.round(v)), duration: 1000 });
  return (
    <div className="rounded-xl bg-line/5 px-3 py-2">
      <p className="eyebrow">{label}</p>
      <p ref={ref} className={`tabular mt-0.5 font-display text-xl font-semibold ${className}`}>{fmtNumber(value)}</p>
    </div>
  );
}

function Money({ value }) {
  const ref = useCountUp(value, { format: (v) => fmtMoney(v), duration: 1200 });
  return <span ref={ref} className="tabular font-medium text-fg" title={fmtMoney(value, { full: true })}>{fmtMoney(value)}</span>;
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      <Skeleton className="h-3 rounded-full" />
      <div className="space-y-1.5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
    </div>
  );
}
