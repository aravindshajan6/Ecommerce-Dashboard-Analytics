import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Mail, MapPin, X } from 'lucide-react';
import { Avatar, Badge, ErrorState, Skeleton } from '../ui/index.js';
import { useOrder } from '../../hooks/useApi.js';
import { useReveal } from '../../hooks/useAnime.js';
import { animate, prefersReducedMotion, utils } from '../../lib/motion.js';
import { fmtDate, fmtMoney, fmtNumber } from '../../lib/format.js';
import { orderNo } from './constants.js';

/** Right-hand slide-over for a single order. Rendered in a portal so ancestor transforms can't trap `position: fixed`. */
export default function OrderDrawer({ id, onClose, restoreScrollTo }) {
  if (!id) return null;
  return createPortal(<Panel id={id} onClose={onClose} restoreScrollTo={restoreScrollTo} />, document.body);
}

function Panel({ id, onClose, restoreScrollTo }) {
  const panelRef = useRef(null);
  const backdropRef = useRef(null);
  const closeRef = useRef(null);
  const closing = useRef(false);
  const { data, isPending, isError, error, refetch } = useOrder(id);

  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (prefersReducedMotion()) { onClose(); return; }
    animate(backdropRef.current, { opacity: 0, duration: 240, ease: 'outQuad' });
    animate(panelRef.current, { translateX: '100%', duration: 360, ease: 'inOutQuad', onComplete: onClose });
  }, [onClose]);

  // Enter: backdrop fade + panel slide from the right.
  useEffect(() => {
    const panel = panelRef.current, backdrop = backdropRef.current;
    if (prefersReducedMotion()) { utils.set(panel, { translateX: '0%' }); utils.set(backdrop, { opacity: 1 }); return undefined; }
    const a = animate(backdrop, { opacity: [0, 1], duration: 300, ease: 'outQuad' });
    const b = animate(panel, { translateX: ['100%', '0%'], duration: 520, ease: 'outExpo' });
    return () => { a.pause(); b.pause(); };
  }, []);

  // ESC to close, lock body scroll, move focus into the dialog.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); requestClose(); } };
    window.addEventListener('keydown', onKey);
    // Pin the body at its current offset while the drawer is open. `overflow: hidden` alone lets the
    // browser clamp scrollY, so the page silently jumped when the drawer opened and closed.
    // prefer the offset captured at click time; window.scrollY may already have been clamped
    const y = restoreScrollTo?.current ?? window.scrollY;
    const b = document.body.style;
    const prev = { overflow: b.overflow, position: b.position, top: b.top, width: b.width };
    b.overflow = 'hidden';
    b.position = 'fixed';
    b.top = `-${y}px`;
    b.width = '100%';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      b.overflow = prev.overflow;
      b.position = prev.position;
      b.top = prev.top;
      b.width = prev.width;
      window.scrollTo(0, y);
    };
  }, [requestClose, restoreScrollTo]);

  const bodyRef = useReveal(!!data, { selector: ':scope > section', each: 60, y: 10, duration: 500 });

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={data ? `Order ${orderNo(data.orderNumber)}` : 'Order details'}>
      <div ref={backdropRef} onClick={requestClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ opacity: 0 }} />
      <aside
        ref={panelRef}
        className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col border-l border-line/10 bg-panel/95 shadow-2xl backdrop-blur-xl"
        style={{ transform: 'translateX(100%)' }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line/10 px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow">Order</p>
            {isPending ? <Skeleton className="mt-1 h-7 w-32" /> : (
              <h2 className="mt-0.5 font-mono text-xl font-semibold text-fg">{data ? orderNo(data.orderNumber) : '—'}</h2>
            )}
            {data && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge>{data.financialStatus || 'unknown'}</Badge>
                <Badge>{data.fulfillmentStatus || 'unfulfilled'}</Badge>
                <Badge>{data.channel || 'web'}</Badge>
                <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-fg-3"><Calendar size={11} />{fmtDate(data.createdAt, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
          <button ref={closeRef} onClick={requestClose} className="btn-ghost !px-2 !py-2" aria-label="Close order details"><X size={16} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isPending ? <DrawerSkeleton /> : isError ? <ErrorState error={error} retry={refetch} /> : data ? (
            <div ref={bodyRef} className="flex flex-col gap-5">
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line/10 bg-line/5 p-3">
                  <p className="eyebrow mb-2">Customer</p>
                  <div className="flex items-center gap-3">
                    <Avatar name={data.customer?.name} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{data.customer?.name || 'Guest'}</p>
                      {data.customer?.email && (
                        <a href={`mailto:${data.customer.email}`} className="flex items-center gap-1 truncate text-[11px] text-fg-3 hover:text-primary"><Mail size={10} />{data.customer.email}</a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-line/10 bg-line/5 p-3">
                  <p className="eyebrow mb-2">Ships to</p>
                  <div className="flex items-start gap-2 text-sm text-fg">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-fg-3" />
                    <div>
                      <p>{data.address?.city || data.city || '—'}</p>
                      <p className="text-[11px] text-fg-3">{data.address?.country || data.country || ''}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <p className="eyebrow mb-2">Items · {fmtNumber(data.lineItems?.length ?? 0)}</p>
                {data.lineItems?.length ? (
                  <div className="table-wrap border border-line/10">
                    <table className="table">
                      <thead><tr><th>Product</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead>
                      <tbody>
                        {data.lineItems.map((li, i) => (
                          <tr key={`${li.productId ?? li.sku ?? i}`} className="[&>td]:py-2.5">
                            <td className="!whitespace-normal">
                              <p className="text-sm font-medium text-fg">{li.name}</p>
                              {li.sku && <p className="font-mono text-[10px] text-fg-3">{li.sku}</p>}
                            </td>
                            <td className="text-right tabular">{fmtNumber(li.quantity)}</td>
                            <td className="text-right tabular text-fg-2">{fmtMoney(li.price, { full: true })}</td>
                            <td className="text-right tabular font-medium">{fmtMoney(li.total, { full: true })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-xs text-fg-3">No line items recorded.</p>}
              </section>

              <section className="rounded-2xl border border-line/10 bg-line/5 p-4">
                <dl className="space-y-1.5 text-sm">
                  <Row label="Subtotal" value={fmtMoney(data.subtotal, { full: true })} />
                  {data.discount > 0 && <Row label="Discount" value={`−${fmtMoney(data.discount, { full: true })}`} tone="text-success" />}
                  <Row label="Shipping" value={fmtMoney(data.shipping ?? 0, { full: true })} />
                  <Row label="Tax" value={fmtMoney(data.tax ?? 0, { full: true })} />
                  <div className="my-1 border-t border-line/10" />
                  <Row label="Total" value={fmtMoney(data.total, { full: true })} strong />
                </dl>
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, strong = false, tone = '' }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? 'font-medium text-fg' : 'text-fg-2'}>{label}</dt>
      <dd className={`tabular ${strong ? 'font-display text-lg font-semibold text-fg' : `font-medium ${tone || 'text-fg'}`}`}>{value}</dd>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      <Skeleton className="h-32" />
    </div>
  );
}
