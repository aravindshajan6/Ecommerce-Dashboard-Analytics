import { useEffect, useMemo, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { Avatar, Badge, GlassCard } from '../ui/index.js';
import { useRecentOrders } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber, timeAgo } from '../../lib/format.js';
import { prefersReducedMotion } from '../../lib/motion.js';
import QueryState from '../charts/QueryState.jsx';

const MAX_VISIBLE = 8;
const ROW_H = 58;

function Rows({ rows }) {
  const listRef = useRef(null);
  const prevRef = useRef(null);
  // Ids not present in the previous payload slide in + flash. Computed in render so StrictMode's double effect agrees.
  const prevIds = prevRef.current ? new Set(prevRef.current.map((r) => r.id)) : null;
  const fresh = rows.filter((r) => !prevIds || !prevIds.has(r.id)).map((r) => String(r.id));

  useEffect(() => {
    prevRef.current = rows;
    if (!fresh.length || !listRef.current || prefersReducedMotion()) return undefined;
    const els = fresh.map((id) => listRef.current.querySelector(`[data-id="${CSS.escape(id)}"]`)).filter(Boolean);
    if (!els.length) return undefined;
    const slide = animate(els, { translateY: [-16, 0], opacity: [0, 1], duration: 650, delay: stagger(60), ease: 'outExpo' });
    const flash = animate(els.map((el) => el.querySelector('[data-flash]')), { opacity: [0.35, 0], duration: 1400, delay: stagger(60), ease: 'outQuad' });
    return () => { slide.pause(); flash.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return (
    <ul ref={listRef} className="-mx-2 overflow-y-auto px-2" style={{ maxHeight: ROW_H * MAX_VISIBLE }}>
      {rows.map((o) => (
        <li key={o.id} data-id={o.id} className="relative flex items-center gap-3 rounded-xl px-2 py-2" style={{ minHeight: ROW_H }}>
          <span data-flash className="pointer-events-none absolute inset-0 rounded-xl bg-teal opacity-0" />
          <Avatar name={o.customer?.name} size={32} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-fg">{o.customer?.name || 'Guest'}</p>
              <p className="tabular shrink-0 text-sm font-semibold text-fg">{fmtMoney(o.total, { full: true })}</p>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-fg-3">
              <span className="flex min-w-0 items-center gap-1 truncate">
                {o.city && <><MapPin size={10} className="shrink-0" /><span className="truncate">{o.city}</span><span>·</span></>}
                <span className="shrink-0">{o.itemCount ?? 0} {o.itemCount === 1 ? 'item' : 'items'}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {o.channel && <Badge className="!py-0">{o.channel}</Badge>}
                <span className="tabular">{timeAgo(o.createdAt)}</span>
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** "Live" ticker of the latest orders — polls /api/orders/recent every 15s. */
export default function LiveOrderFeed({ className }) {
  const q = useRecentOrders(12, 15_000);
  const perHour = useMemo(() => {
    const rows = q.data ?? [];
    if (rows.length < 2) return null;
    const ts = rows.map((r) => new Date(r.createdAt).getTime()).filter((t) => !Number.isNaN(t));
    const span = (Math.max(...ts) - Math.min(...ts)) / 36e5;
    return span > 0 ? rows.length / span : null;
  }, [q.data]);

  return (
    <GlassCard
      title={<span className="inline-flex items-center gap-2"><span className="live-dot" />Live orders</span>}
      subtitle="Latest orders as they land" className={className}
      action={perHour != null && (
        <div className="text-right">
          <p className="tabular font-display text-lg font-semibold leading-none text-fg">{fmtNumber(perHour, { digits: perHour < 10 ? 1 : 0 })}</p>
          <p className="eyebrow !text-[9px]">orders / hour</p>
        </div>
      )}
    >
      <QueryState query={q} table emptyTitle="No orders yet">{(rows) => <Rows rows={rows} />}</QueryState>
    </GlassCard>
  );
}
