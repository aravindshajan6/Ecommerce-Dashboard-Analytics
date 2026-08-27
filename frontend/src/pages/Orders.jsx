import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Boxes, Download, Receipt, ShoppingBag, Undo2 } from 'lucide-react';
import { ErrorState, GlassCard, KpiCard, PageHeader } from '../components/ui/index.js';
import { useOrders, useSummary } from '../hooks/useApi.js';
import { useReveal } from '../hooks/useAnime.js';
import { fmtMoney, fmtNumber, fmtPct } from '../lib/format.js';
import StatusFunnel from '../components/orders/StatusFunnel.jsx';
import StatusDonuts from '../components/orders/StatusDonuts.jsx';
import OrdersTimeseries from '../components/charts/OrdersTimeseries.jsx';
import OrdersFilters from '../components/orders/OrdersFilters.jsx';
import OrdersTable from '../components/orders/OrdersTable.jsx';
import { PAGE_SIZES, SORT_OPTIONS, STATUS_OPTIONS, orderNo } from '../components/orders/constants.js';
import OrderDrawer from '../components/orders/OrderDrawer.jsx';

const DEFAULT_SORT = 'createdAt:desc';
const DEFAULTS = { page: '1', limit: '20', search: '', status: '', sort: DEFAULT_SORT };

/** Filter state lives in the URL (?page&limit&search&status&sort) so views are shareable. */
function readParams(sp) {
  const limit = Number(sp.get('limit'));
  const status = sp.get('status') ?? '';
  return {
    page: Math.max(1, parseInt(sp.get('page'), 10) || 1),
    limit: PAGE_SIZES.includes(limit) ? limit : 20,
    search: sp.get('search') ?? '',
    status: STATUS_OPTIONS.some((o) => o.value === status) ? status : '',
    sort: sp.get('sort') || DEFAULT_SORT,
  };
}

/** Local helper: current page rows → CSV download. */
function exportCsv(rows, page) {
  const cell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const header = ['order', 'date', 'customer', 'email', 'items', 'total', 'currency', 'financial_status', 'fulfillment_status', 'channel', 'city', 'country'];
  const lines = rows.map((r) => [orderNo(r.orderNumber), r.createdAt, r.customer?.name, r.customer?.email, r.itemCount, r.total, r.currency, r.financialStatus, r.fulfillmentStatus, r.channel, r.city, r.country].map(cell).join(','));
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `orders-page-${page}.csv` });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function Orders() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search: qs } = useLocation();
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => readParams(sp), [sp]);

  const update = useCallback((patch) => {
    const next = new URLSearchParams(sp);
    if (Object.keys(patch).some((k) => k !== 'page')) next.delete('page'); // any filter change → page 1
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '' || String(v) === DEFAULTS[k]) next.delete(k); else next.set(k, String(v));
    }
    setSp(next, { replace: true });
  }, [sp, setSp]);

  const summary = useSummary();
  const k = summary.data?.kpis;
  const orders = useOrders({ page: params.page, limit: params.limit, search: params.search || undefined, status: params.status || undefined, sort: params.sort });
  const rows = orders.data?.rows ?? [];

  // Clamp an out-of-range page (e.g. a stale shared link).
  useEffect(() => {
    if (orders.data?.pages && params.page > orders.data.pages) update({ page: orders.data.pages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.data?.pages]);

  const openOrder = useCallback((row) => navigate({ pathname: `/orders/${encodeURIComponent(row.id)}`, search: qs }), [navigate, qs]);
  const closeOrder = useCallback(() => navigate({ pathname: '/orders', search: qs }), [navigate, qs]);

  const grid = useReveal(true, { each: 60, y: 14 });

  return (
    <>
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Every order across channels, with status and drill-down."
        actions={
          <button className="btn-ghost" onClick={() => exportCsv(rows, params.page)} disabled={rows.length === 0} title="Download the rows currently shown">
            <Download size={15} /> Export CSV
          </button>
        }
      />

      <div ref={grid} className="grid grid-cols-12 gap-4">
        {summary.isError ? (
          <GlassCard className="col-span-12 min-h-[132px]"><ErrorState error={summary.error} retry={summary.refetch} /></GlassCard>
        ) : (
          <>
            <KpiCard className="col-span-12 sm:col-span-6 xl:col-span-3" label="Orders" icon={ShoppingBag} kpi={k?.orders} loading={summary.isPending} format={(v) => fmtNumber(v)} tone="primary" />
            <KpiCard className="col-span-12 sm:col-span-6 xl:col-span-3" label="Avg order value" icon={Receipt} kpi={k?.aov} loading={summary.isPending} format={(v) => fmtMoney(v)} tone="teal" />
            <KpiCard className="col-span-12 sm:col-span-6 xl:col-span-3" label="Units sold" icon={Boxes} kpi={k?.unitsSold} loading={summary.isPending} format={(v) => fmtNumber(v)} tone="violet" />
            <KpiCard className="col-span-12 sm:col-span-6 xl:col-span-3" label="Refund rate" icon={Undo2} kpi={k?.refundRate} loading={summary.isPending} format={(v) => fmtPct(v * 100)} invert tone="pink" />
          </>
        )}

        <StatusFunnel className="col-span-12 lg:col-span-7" />
        <StatusDonuts className="col-span-12 lg:col-span-5" />

        <OrdersTimeseries className="col-span-12" />

        <GlassCard
          className="col-span-12 min-h-[520px]"
          title="All orders"
          subtitle={orders.data ? `${fmtNumber(orders.data.total)} orders${params.search || params.status ? ' match' : ''} · click a row for details` : 'Loading…'}
          action={orders.isFetching && !orders.isPending ? <span className="flex items-center gap-1.5 text-[11px] text-fg-3"><span className="live-dot" /> Updating</span> : null}
        >
          <div className="mb-4">
            <OrdersFilters search={params.search} status={params.status} sort={params.sort} limit={params.limit} onChange={update} />
            {params.sort !== DEFAULT_SORT && !SORT_OPTIONS.some((o) => o.value === params.sort) && (
              <p className="mt-2 text-[11px] text-fg-3">Sorted by column: <span className="font-mono">{params.sort}</span></p>
            )}
          </div>
          {orders.isError ? (
            <ErrorState error={orders.error} retry={orders.refetch} />
          ) : (
            <OrdersTable
              rows={rows}
              loading={orders.isPending}
              sort={params.sort}
              onSortChange={(sort) => update({ sort })}
              onRowClick={openOrder}
              pagination={orders.data ? { page: orders.data.page, pages: orders.data.pages, total: orders.data.total, limit: orders.data.limit, onPage: (p) => update({ page: p }) } : undefined}
            />
          )}
        </GlassCard>
      </div>

      <OrderDrawer id={id} onClose={closeOrder} />
    </>
  );
}
