import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { EmptyState, ErrorState, GlassCard, PageHeader, Segmented, Skeleton } from '../components/ui/index.js';
import { useProducts, useSalesCategories, useSummary, useTopProducts } from '../hooks/useApi.js';
import { useReveal } from '../hooks/useAnime.js';
import { fmtMoney, fmtNumber } from '../lib/format.js';
import ProductPodium from '../components/three/ProductPodium.jsx';
import ProductSpotlight from '../components/products/ProductSpotlight.jsx';
import InventoryPanel from '../components/products/InventoryPanel.jsx';
import CategoryBars from '../components/products/CategoryBars.jsx';
import ProductFilters from '../components/products/ProductFilters.jsx';
import { SORT_OPTIONS, STOCK_OPTIONS } from '../components/products/constants.js';
import ProductsTable from '../components/products/ProductsTable.jsx';

const BY = [{ value: 'revenue', label: 'By revenue' }, { value: 'units', label: 'By units' }];
const DEFAULT_SORT = 'revenue:desc';
const DEFAULTS = { page: '1', limit: '20', search: '', category: '', status: '', sort: DEFAULT_SORT, by: 'revenue' };
const PAGE_SIZE = 20;

function readParams(sp) {
  const status = sp.get('status') ?? '';
  return {
    page: Math.max(1, parseInt(sp.get('page'), 10) || 1),
    search: sp.get('search') ?? '',
    category: sp.get('category') ?? '',
    status: STOCK_OPTIONS.some((o) => o.value === status) ? status : '',
    sort: sp.get('sort') || DEFAULT_SORT,
    by: sp.get('by') === 'units' ? 'units' : 'revenue',
  };
}

export default function Products() {
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => readParams(sp), [sp]);

  const update = useCallback((patch) => {
    const next = new URLSearchParams(sp);
    if (Object.keys(patch).some((k) => k !== 'page' && k !== 'by')) next.delete('page');
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '' || String(v) === DEFAULTS[k]) next.delete(k); else next.set(k, String(v));
    }
    setSp(next, { replace: true });
  }, [sp, setSp]);

  const summary = useSummary();
  const top = useTopProducts({ limit: 3, by: params.by });
  const categories = useSalesCategories();
  const products = useProducts({ page: params.page, limit: PAGE_SIZE, search: params.search || undefined, sort: params.sort });

  useEffect(() => {
    if (products.data?.pages && params.page > products.data.pages) update({ page: products.data.pages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.data?.pages]);

  const top3 = (top.data ?? []).slice(0, 3);
  const categoryNames = useMemo(() => [...new Set((categories.data ?? []).map((c) => c.category).filter(Boolean))].sort(), [categories.data]);

  // /api/products has no category/status params → filter the current page client-side (noted in the UI).
  const pageRows = products.data?.rows ?? [];
  const clientFiltered = !!(params.category || params.status);
  const rows = clientFiltered
    ? pageRows.filter((r) => (!params.category || r.category === params.category) && (!params.status || r.status === params.status))
    : pageRows;

  const grid = useReveal(true, { each: 60, y: 14 });

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Performance, inventory health and category mix."
        actions={<Segmented options={BY} value={params.by} onChange={(by) => update({ by })} />}
      />

      <div ref={grid} className="grid grid-cols-12 gap-4">
        <ProductSpotlight
          className="col-span-12 lg:col-span-4"
          product={top3[0]}
          by={params.by}
          totalRevenue={summary.data?.kpis?.revenue?.value}
          loading={top.isPending}
          error={top.isError ? top.error : null}
          retry={top.refetch}
        />

        <GlassCard className="col-span-12 min-h-[300px] lg:col-span-8" icon={Trophy} title="Top 3" subtitle={`Ranked by ${params.by} for the selected range`}>
          {top.isPending ? (
            <div className="grid gap-4 md:grid-cols-[1fr_220px]" aria-busy="true">
              <Skeleton className="h-[300px]" />
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            </div>
          ) : top.isError ? (
            <div className="grid h-[300px] place-items-center"><ErrorState error={top.error} retry={top.refetch} /></div>
          ) : top3.length === 0 ? (
            <div className="grid h-[300px] place-items-center"><EmptyState icon={Trophy} title="No products sold in this range" /></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <ProductPodium products={top3} height={300} className="w-full" />
              <ol className="flex flex-col justify-center gap-2">
                {top3.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line/10 bg-line/5 px-3 py-2">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-sm font-semibold ${['bg-warning/20 text-warning', 'bg-line/10 text-fg-2', 'bg-pink/15 text-pink'][i]}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg" title={p.title}>{p.title}</p>
                      <p className="truncate text-[11px] text-fg-3">{p.category || 'Uncategorized'}</p>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold text-fg">{params.by === 'units' ? fmtNumber(p.units) : fmtMoney(p.revenue)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </GlassCard>

        <InventoryPanel className="col-span-12 lg:col-span-5" />
        <CategoryBars className="col-span-12 lg:col-span-7" />

        <GlassCard
          className="col-span-12 min-h-[520px]"
          title="All products"
          subtitle={products.data ? `${fmtNumber(products.data.total)} products${params.search ? ' match' : ''}` : 'Loading…'}
          action={products.isFetching && !products.isPending ? <span className="flex items-center gap-1.5 text-[11px] text-fg-3"><span className="live-dot" /> Updating</span> : null}
        >
          <div className="mb-4">
            <ProductFilters search={params.search} category={params.category} status={params.status} sort={params.sort} categories={categoryNames} onChange={update} />
            {clientFiltered && (
              <p className="mt-2 text-[11px] text-fg-3">
                Category and stock filters apply to the current page only ({rows.length} of {pageRows.length} rows shown) — the products API does not filter by them.
              </p>
            )}
            {params.sort !== DEFAULT_SORT && !SORT_OPTIONS.some((o) => o.value === params.sort) && (
              <p className="mt-2 text-[11px] text-fg-3">Sorted by column: <span className="font-mono">{params.sort}</span></p>
            )}
          </div>
          {products.isError ? (
            <ErrorState error={products.error} retry={products.refetch} />
          ) : (
            <ProductsTable
              rows={rows}
              loading={products.isPending}
              sort={params.sort}
              onSortChange={(sort) => update({ sort })}
              emptyTitle={clientFiltered && pageRows.length > 0 ? 'No rows on this page match the category/stock filter' : undefined}
              pagination={products.data ? { page: products.data.page, pages: products.data.pages, total: products.data.total, limit: products.data.limit, onPage: (p) => update({ page: p }) } : undefined}
            />
          )}
        </GlassCard>
      </div>
    </>
  );
}
