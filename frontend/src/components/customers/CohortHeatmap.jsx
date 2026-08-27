import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Grid3x3 } from 'lucide-react';
import { GlassCard, Segmented, Skeleton, ErrorState, EmptyState } from '../ui/index.js';
import CohortBars from '../three/CohortBars.jsx';
import { useCohorts } from '../../hooks/useApi.js';
import { useAnimeScope } from '../../hooks/useAnime.js';
import { animate, stagger, utils, prefersReducedMotion } from '../../lib/motion.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { C } from '../charts/theme.js';

const VIEWS = [{ value: '2d', label: '2D matrix' }, { value: '3d', label: '3D surface' }];
const MONTHS = [{ value: 6, label: '6 mo' }, { value: 12, label: '12 mo' }];
const MAX_COLS = 12;
const H3D = 380;

/** teal (0%) → primary (50%) → pink (100%), alpha grows with pct so low retention stays faint. */
function cellBackground(pct) {
  const p = Math.max(0, Math.min(100, pct));
  const hue = p <= 50
    ? `color-mix(in oklab, ${C.teal} ${Math.round(100 - p * 2)}%, ${C.primary})`
    : `color-mix(in oklab, ${C.primary} ${Math.round(100 - (p - 50) * 2)}%, ${C.pink})`;
  const alpha = Math.round(14 + (p / 100) * 86);
  return `color-mix(in oklab, ${hue} ${alpha}%, transparent)`;
}

const HIDDEN = { opacity: 0 };

function MatrixSkeleton({ rows = 8 }) {
  return (
    <div className="space-y-1.5" aria-busy="true" style={{ minHeight: H3D }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-1.5">
          <Skeleton className="h-9 w-24 shrink-0" />
          {Array.from({ length: 10 }).map((_, c) => <Skeleton key={c} className="h-9 flex-1" style={{ opacity: 1 - c * 0.07 }} />)}
        </div>
      ))}
    </div>
  );
}

function Matrix({ rows, cols }) {
  const [hover, setHover] = useState(null);
  const root = useAnimeScope(() => {
    if (prefersReducedMotion()) { utils.set('.cell', { opacity: 1 }); return; }
    animate('.cell', {
      opacity: [0, 1],
      scale: [0.7, 1],
      duration: 600,
      delay: stagger(18, { grid: [cols, rows.length], from: 'first' }),
      ease: 'outExpo',
    });
  }, [rows, cols]);

  const inCross = (r, c) => hover && (hover.r === r || hover.c === c);

  return (
    <div ref={root} onMouseLeave={() => setHover(null)}>
      <div className="table-wrap">
        <table className="w-full border-separate border-spacing-[3px] text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card/90 px-2 py-1 text-left eyebrow backdrop-blur-sm">Cohort</th>
              <th className="px-2 py-1 text-right eyebrow">Customers</th>
              <th className="px-2 py-1 text-right eyebrow">LTV</th>
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className={clsx('px-1 py-1 text-center eyebrow transition-colors', hover?.c === c && '!text-fg')}>M{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row.cohort ?? row.label}>
                <td className={clsx('sticky left-0 z-10 whitespace-nowrap bg-card/90 px-2 font-medium backdrop-blur-sm transition-colors', hover?.r === r ? 'text-fg' : 'text-fg-2')}>{row.label ?? row.cohort}</td>
                <td className="px-2 text-right tabular text-fg-3">{fmtNumber(row.customers)}</td>
                <td className="px-2 text-right tabular text-fg-3">{fmtMoney(row.ltv)}</td>
                {Array.from({ length: cols }).map((_, c) => {
                  const pct = row.retention?.[c];
                  const has = pct != null && Number.isFinite(pct);
                  return (
                    <td key={c} className="p-0">
                      <div
                        className={clsx(
                          'cell grid h-9 min-w-[46px] place-items-center rounded-md font-medium tabular transition-[filter,box-shadow] duration-200',
                          has ? '' : 'border border-dashed border-line/10',
                          hover && (inCross(r, c) ? 'ring-1 ring-line/40 brightness-110' : 'saturate-50'),
                        )}
                        style={has ? { ...HIDDEN, background: cellBackground(pct), color: pct >= 60 ? '#fff' : 'rgb(var(--fg))' } : HIDDEN}
                        onMouseEnter={() => setHover({ r, c })}
                        title={has ? `${row.label ?? row.cohort} · month ${c}: ${pct.toFixed(1)}% retained` : undefined}
                      >
                        {has ? `${Math.round(pct)}%` : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-fg-3">
        <span>Retention</span>
        <span className="h-2 w-40 rounded-full" style={{ background: `linear-gradient(90deg, ${cellBackground(0)}, ${cellBackground(50)}, ${cellBackground(100)})` }} />
        <span className="tabular">0% · 50% · 100%</span>
        <span className="ml-auto hidden sm:inline">Rows = first-purchase month · columns = months since</span>
      </div>
    </div>
  );
}

export default function CohortHeatmap({ className }) {
  const [view, setView] = useState('2d');
  const [months, setMonths] = useState(12);
  const { data, isPending, error, refetch } = useCohorts(months);
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const cols = useMemo(() => Math.min(MAX_COLS, Math.max(1, ...rows.map((r) => r.retention?.length ?? 0))), [rows]);

  return (
    <GlassCard
      title="Cohort retention"
      subtitle="Share of each monthly cohort that ordered again"
      icon={Grid3x3}
      className={clsx('min-h-[460px]', className)}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Segmented size="xs" options={MONTHS} value={months} onChange={setMonths} />
          <Segmented size="xs" options={VIEWS} value={view} onChange={setView} />
        </div>
      }
    >
      {isPending ? (
        <MatrixSkeleton />
      ) : error ? (
        <div className="grid place-items-center" style={{ minHeight: H3D }}><ErrorState error={error} retry={refetch} /></div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center" style={{ minHeight: H3D }}><EmptyState title="No cohorts yet" body="Cohorts appear once customers place their first orders." /></div>
      ) : view === '3d' ? (
        <CohortBars cohorts={rows} height={H3D} />
      ) : (
        <Matrix rows={rows} cols={cols} />
      )}
    </GlassCard>
  );
}
