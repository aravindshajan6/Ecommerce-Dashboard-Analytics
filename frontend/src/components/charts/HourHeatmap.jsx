import { Fragment, useMemo, useRef, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { GlassCard, Segmented } from '../ui/index.js';
import { useSalesHeatmap } from '../../hooks/useApi.js';
import { useReveal } from '../../hooks/useAnime.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import QueryState from './QueryState.jsx';
import { DAYS, hourLabel } from './series.js';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const METRICS = [{ value: 'revenue', label: 'Revenue' }, { value: 'orders', label: 'Orders' }];
const fmtMetric = (metric, v) => (metric === 'revenue' ? fmtMoney(v, { full: true }) : fmtNumber(v));

/** teal → primary → pink, following the theme via color-mix; zero cells stay neutral. */
function cellColor(t) {
  if (t <= 0) return 'rgb(var(--line) / 0.06)';
  return t < 0.5
    ? `color-mix(in oklab, rgb(var(--teal)), rgb(var(--primary)) ${Math.round(t * 200)}%)`
    : `color-mix(in oklab, rgb(var(--primary)), rgb(var(--pink)) ${Math.round((t - 0.5) * 200)}%)`;
}

function Grid({ data, metric }) {
  const wrap = useRef(null);
  const [hover, setHover] = useState(null);
  const { lookup, max } = useMemo(() => {
    const lookup = new Map();
    let max = 0;
    for (const c of data) { lookup.set(`${c.dow}-${c.hour}`, c); max = Math.max(max, c[metric] || 0); }
    return { lookup, max };
  }, [data, metric]);
  const revealRef = useReveal(true, { selector: '[data-cell]', each: 2, y: 4, duration: 400 });

  const onEnter = (cell, e) => {
    const r = wrap.current.getBoundingClientRect();
    const t = e.currentTarget.getBoundingClientRect();
    setHover({ cell, x: Math.min(Math.max(t.left - r.left + t.width / 2, 70), r.width - 70), y: t.top - r.top });
  };

  return (
    <div ref={wrap} className="relative" onMouseLeave={() => setHover(null)}>
      <div ref={revealRef} className="grid gap-[3px]" style={{ gridTemplateColumns: '30px repeat(24, minmax(0, 1fr))' }}>
        {DAYS.map((d, dow) => (
          <Fragment key={d}>
            <span className="self-center text-[10px] font-medium text-fg-3">{d}</span>
            {HOURS.map((h) => {
              const cell = lookup.get(`${dow}-${h}`) ?? { dow, hour: h, orders: 0, revenue: 0 };
              const t = max ? (cell[metric] || 0) / max : 0;
              return (
                <div key={h} data-cell role="img" aria-label={`${d} ${hourLabel(h)}: ${fmtMetric(metric, cell[metric])}`}
                  className="h-5 cursor-pointer rounded-[4px] transition-transform duration-150 hover:scale-125 md:h-6"
                  style={{ background: cellColor(t), opacity: t > 0 ? 0.3 + 0.7 * t : 1 }}
                  onMouseEnter={(e) => onEnter(cell, e)} />
              );
            })}
          </Fragment>
        ))}
        <span />
        {HOURS.map((h) => <span key={h} className="overflow-visible whitespace-nowrap text-center text-[9px] text-fg-3">{h % 3 === 0 ? hourLabel(h) : ''}</span>)}
      </div>

      {hover && (
        <div className="glass pointer-events-none absolute z-10 !rounded-lg px-2.5 py-1.5 text-xs shadow-xl" style={{ left: hover.x, top: hover.y, transform: 'translate(-50%, calc(-100% - 8px))', '--glass-alpha': 0.95 }}>
          <p className="font-medium text-fg">{DAYS[hover.cell.dow]} · {hourLabel(hover.cell.hour)}</p>
          <p className="tabular text-fg-2">{fmtNumber(hover.cell.orders)} orders · {fmtMoney(hover.cell.revenue, { full: true })}</p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-fg-3">
        <span>Low</span>
        <span className="h-1.5 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, rgb(var(--teal)), rgb(var(--primary)), rgb(var(--pink)))' }} />
        <span>High · peak {fmtMetric(metric, max)}</span>
      </div>
    </div>
  );
}

/** 7×24 weekday × hour grid. Data: /api/sales/heatmap (168 cells). */
export default function HourHeatmap({ className, height = 230 }) {
  const q = useSalesHeatmap();
  const [metric, setMetric] = useState('revenue');
  return (
    <GlassCard title="Order rhythm" subtitle="When customers buy — weekday × hour" icon={CalendarClock} className={className}
      action={<Segmented size="xs" options={METRICS} value={metric} onChange={setMetric} />}>
      <QueryState query={q} height={height} isEmpty={(d) => !d?.length || d.every((c) => !c.orders)}>
        {(data) => <Grid data={data} metric={metric} />}
      </QueryState>
    </GlassCard>
  );
}
