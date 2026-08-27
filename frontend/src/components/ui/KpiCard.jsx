import clsx from 'clsx';
import GlassCard from './GlassCard.jsx';
import DeltaPill from './DeltaPill.jsx';
import Sparkline from './Sparkline.jsx';
import { Skeleton } from './Skeleton.jsx';
import { useCountUp } from '../../hooks/useAnime.js';

const TONES = {
  primary: { color: 'rgb(var(--primary))', chip: 'bg-primary/15 text-primary' },
  teal: { color: 'rgb(var(--teal))', chip: 'bg-teal/15 text-teal' },
  pink: { color: 'rgb(var(--pink))', chip: 'bg-pink/15 text-pink' },
  violet: { color: 'rgb(var(--violet))', chip: 'bg-violet/15 text-violet' },
  warning: { color: 'rgb(var(--warning))', chip: 'bg-warning/15 text-warning' },
};

/**
 * KPI tile: label, animated value, delta pill, sparkline.
 * `value` numeric; `format(v)` → string; `kpi` may be the API object { value, deltaPct, spark }.
 */
export default function KpiCard({ label, icon: Icon, kpi, value, format = (v) => Math.round(v).toLocaleString(), tone = 'primary', invert = false, loading, className, hint }) {
  const v = value ?? kpi?.value;
  const ref = useCountUp(loading ? null : v, { format });
  const t = TONES[tone] || TONES.primary;
  return (
    <GlassCard className={clsx('min-h-[132px]', className)} bodyClassName="flex flex-col justify-between gap-3" aria-label={`${label}: ${v != null ? format(v) : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="eyebrow">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-28" />
          ) : (
            <p className="kpi-number mt-1.5 text-fg" ref={ref}>{v != null ? format(v) : '—'}</p>
          )}
        </div>
        {Icon && <span className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', t.chip)}><Icon size={17} /></span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          {loading ? <Skeleton className="h-5 w-16" /> : <DeltaPill value={kpi?.deltaPct} invert={invert} />}
          {hint && !loading && <span className="text-[11px] text-fg-3">{hint}</span>}
        </div>
        <div className="min-w-0 flex-1 max-w-[120px]">
          {loading ? <Skeleton className="h-9 w-full" /> : <Sparkline data={kpi?.spark} color={t.color} />}
        </div>
      </div>
    </GlassCard>
  );
}
