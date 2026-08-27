import { useMemo } from 'react';
import { CalendarDays, Clock3, Star } from 'lucide-react';
import { ErrorState, GlassCard, Skeleton } from '../ui/index.js';
import { useSalesHeatmap, useSalesTimeseries } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { DAYS, hourLabel } from '../charts/series.js';

const argmax = (arr) => arr.reduce((best, v, i) => (v > arr[best] ? i : best), 0);

function Stat({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line/10 bg-line/5 px-4 py-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={16} /></span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{label}</p>
        <p className="truncate font-display text-lg font-semibold leading-tight text-fg">{value ?? '—'}</p>
      </div>
      {sub && <p className="tabular shrink-0 text-xs text-fg-3">{sub}</p>}
    </div>
  );
}

/** "Best day / hour / month" — derived from /api/sales/heatmap and the monthly timeseries. */
export default function BestTimes({ className }) {
  const heat = useSalesHeatmap();
  const ts = useSalesTimeseries('monthly');

  const stats = useMemo(() => {
    const byDay = Array(7).fill(0), byHour = Array(24).fill(0);
    for (const c of heat.data ?? []) { byDay[c.dow] += c.revenue || 0; byHour[c.hour] += c.revenue || 0; }
    const any = byDay.some(Boolean);
    const rows = ts.data ?? [];
    const best = rows.length ? rows.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null;
    return {
      day: any ? { value: DAYS[argmax(byDay)], sub: fmtMoney(byDay[argmax(byDay)]) } : null,
      hour: any ? { value: hourLabel(argmax(byHour)), sub: fmtMoney(byHour[argmax(byHour)]) } : null,
      month: best ? { value: best.label, sub: `${fmtMoney(best.revenue)} · ${fmtNumber(best.orders)} orders` } : null,
    };
  }, [heat.data, ts.data]);

  const loading = heat.isPending || ts.isPending;
  const error = heat.error || ts.error;

  return (
    <GlassCard title="Best times to sell" subtitle="Peaks by revenue" icon={Star} className={className}>
      {error && !loading ? (
        <ErrorState error={error} retry={() => { heat.refetch(); ts.refetch(); }} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[62px] rounded-2xl" />) : (
            <>
              <Stat icon={CalendarDays} label="Best day" tone="bg-teal/15 text-teal" value={stats.day?.value} sub={stats.day?.sub} />
              <Stat icon={Clock3} label="Best hour" tone="bg-primary/15 text-primary" value={stats.hour?.value} sub={stats.hour?.sub} />
              <Stat icon={Star} label="Best month" tone="bg-pink/15 text-pink" value={stats.month?.value} sub={stats.month?.sub} />
            </>
          )}
        </div>
      )}
    </GlassCard>
  );
}
