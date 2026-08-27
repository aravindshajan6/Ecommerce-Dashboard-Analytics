import clsx from 'clsx';
import { Building2, Flag, CircleQuestionMark, Crown } from 'lucide-react';
import { Skeleton } from '../ui/index.js';
import { useCountUp } from '../../hooks/useAnime.js';
import { fmtNumber, fmtPct } from '../../lib/format.js';
import { flagEmoji } from './flag.js';

function Chip({ icon: Icon, label, value, format = (v) => fmtNumber(v), tone, hint, loading }) {
  const ref = useCountUp(loading || value == null ? null : value, { format, duration: 1100 });
  return (
    <div className="glass flex min-h-[68px] items-center gap-3 px-4 py-3">
      <span className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', tone)}><Icon size={16} /></span>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-5 w-16" />
        ) : (
          <p className="flex items-baseline gap-1.5">
            <span ref={ref} className="font-display text-lg font-semibold tabular text-fg">{value != null ? format(value) : '—'}</span>
            {hint && <span className="truncate text-[11px] text-fg-3">{hint}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

/** Chips row. Props: { points (ranked, with share), unknown, loading, className } */
export default function GeoStats({ points = [], unknown = 0, loading, className }) {
  const countries = new Set(points.map((p) => p.country).filter(Boolean)).size;
  const top = points[0];
  return (
    <div className={clsx('grid grid-cols-2 gap-3 md:grid-cols-4', className)}>
      <Chip icon={Building2} label="Cities" value={points.length} tone="bg-primary/15 text-primary" loading={loading} />
      <Chip icon={Flag} label="Countries" value={countries} tone="bg-teal/15 text-teal" loading={loading} />
      <Chip
        icon={Crown}
        label="Top city share"
        value={top ? (top.share ?? 0) * 100 : null}
        format={(v) => fmtPct(v)}
        hint={top ? `${flagEmoji(top.countryCode)} ${top.city}`.trim() : undefined}
        tone="bg-pink/15 text-pink"
        loading={loading}
      />
      <Chip icon={CircleQuestionMark} label="Unknown location" value={unknown ?? 0} hint="customers" tone="bg-warning/15 text-warning" loading={loading} />
    </div>
  );
}
