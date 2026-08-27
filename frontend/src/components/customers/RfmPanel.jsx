import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { Target } from 'lucide-react';
import { GlassCard, ChartSkeleton, ErrorState, EmptyState, Skeleton } from '../ui/index.js';
import { axisProps, gridProps } from '../charts/theme.js';
import { useRfm } from '../../hooks/useApi.js';
import { useReveal } from '../../hooks/useAnime.js';
import { fmtMoney, fmtNumber, fmtPct } from '../../lib/format.js';
import { segmentColor, segmentDescription, segmentTint } from './segments.js';

const H = 340;
const MAX_POINTS = 1200;

const SPAN = (rank) => (rank === 0 ? 'col-span-2 row-span-2' : rank < 3 ? 'col-span-2' : 'col-span-1');

function SegmentCard({ s, rank, active, onToggle }) {
  const color = segmentColor(s.segment);
  const big = rank === 0;
  const dim = active && active !== s.segment;
  return (
    <button
      type="button"
      onClick={() => onToggle(s.segment)}
      aria-pressed={active === s.segment}
      className={clsx(
        'group relative flex min-h-[64px] flex-col justify-between overflow-visible rounded-xl border p-2.5 text-left transition-all duration-200',
        SPAN(rank), dim ? 'opacity-40' : 'opacity-100', active === s.segment && 'ring-2 ring-offset-0',
      )}
      style={{ background: segmentTint(s.segment, active === s.segment ? 28 : 16), borderColor: segmentTint(s.segment, 45), '--tw-ring-color': color }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={clsx('line-clamp-2 font-medium leading-tight', big ? 'text-sm' : 'text-[11px]')} style={{ color }}>{s.segment}</span>
        {rank < 3 && <span className="shrink-0 text-[10px] tabular text-fg-3">{fmtPct((s.share ?? 0) * 100, { digits: 0 })}</span>}
      </div>
      <div>
        <p className={clsx('font-display font-semibold tabular text-fg', big ? 'text-2xl' : 'text-base')}>{fmtNumber(s.count)}</p>
        {(big || rank < 3) && <p className="text-[11px] tabular text-fg-3">{fmtMoney(s.revenue)} revenue</p>}
      </div>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-48 -translate-x-1/2 rounded-lg border border-line/10 bg-card px-2.5 py-2 text-[11px] leading-snug text-fg-2 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <b className="text-fg">{s.segment}</b> · {fmtNumber(s.count)} customers · {fmtMoney(s.revenue)}<br />
        {segmentDescription(s.segment, s.description)}
      </span>
    </button>
  );
}

function RfmTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass !rounded-xl px-3 py-2 text-xs shadow-xl" style={{ '--glass-alpha': 0.92 }}>
      <p className="mb-1 font-medium" style={{ color: segmentColor(p.segment) }}>{p.segment}</p>
      <ul className="space-y-0.5 text-fg-2">
        <li className="flex justify-between gap-4"><span>Recency</span><span className="tabular text-fg">{fmtNumber(p.recency)} days</span></li>
        <li className="flex justify-between gap-4"><span>Frequency</span><span className="tabular text-fg">{fmtNumber(p.frequency)} orders</span></li>
        <li className="flex justify-between gap-4"><span>Monetary</span><span className="tabular text-fg">{fmtMoney(p.monetary, { full: true })}</span></li>
      </ul>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2" aria-busy="true">
      {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className={clsx('min-h-[64px]', SPAN(i))} />)}
    </div>
  );
}

export default function RfmPanel({ className }) {
  const { data, isPending, error, refetch } = useRfm();
  const [active, setActive] = useState(null);

  const segments = useMemo(() => [...(data?.segments ?? [])].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)), [data]);
  const groups = useMemo(() => {
    const all = Array.isArray(data?.scatter) ? data.scatter : [];
    const step = Math.max(1, Math.ceil(all.length / MAX_POINTS));
    const map = new Map();
    all.forEach((p, i) => {
      if (i % step !== 0) return;
      if (!map.has(p.segment)) map.set(p.segment, []);
      map.get(p.segment).push(p);
    });
    // draw in the same order as the cards so bigger segments sit underneath
    return segments.map((s) => [s.segment, map.get(s.segment) ?? []]).filter(([, pts]) => pts.length > 0);
  }, [data, segments]);

  const gridRef = useReveal(!isPending && segments.length > 0, { each: 45, y: 8, duration: 600 });
  const toggle = (seg) => setActive((a) => (a === seg ? null : seg));

  return (
    <GlassCard
      title="RFM segments"
      subtitle="Recency · frequency · monetary — click a segment to isolate it"
      icon={Target}
      className={clsx('min-h-[440px]', className)}
      action={active && <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => setActive(null)}>Clear</button>}
    >
      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2"><GridSkeleton /><ChartSkeleton height={H} bars={10} /></div>
      ) : error ? (
        <div className="grid place-items-center" style={{ minHeight: H }}><ErrorState error={error} retry={refetch} /></div>
      ) : segments.length === 0 ? (
        <div className="grid place-items-center" style={{ minHeight: H }}><EmptyState title="Not enough orders to segment customers" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div ref={gridRef} className="grid grid-cols-4 content-start gap-2">
            {segments.map((s, i) => <SegmentCard key={s.segment} s={s} rank={i} active={active} onToggle={toggle} />)}
          </div>
          <div style={{ height: H }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 4 }}>
                <CartesianGrid {...gridProps} vertical />
                <XAxis type="number" dataKey="recency" name="Recency" {...axisProps} width={40} label={{ value: 'Recency (days)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'rgb(var(--fg-3))' }} />
                <YAxis type="number" dataKey="frequency" name="Frequency" {...axisProps} width={36} allowDecimals={false} label={{ value: 'Orders', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'rgb(var(--fg-3))' }} />
                <ZAxis type="number" dataKey="monetary" range={[24, 360]} />
                <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'rgb(var(--line) / 0.3)' }} content={<RfmTooltip />} />
                {groups.map(([seg, pts]) => (
                  <Scatter
                    key={seg}
                    name={seg}
                    data={pts}
                    fill={segmentColor(seg)}
                    fillOpacity={active && active !== seg ? 0.08 : 0.7}
                    isAnimationActive={pts.length < 300}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
