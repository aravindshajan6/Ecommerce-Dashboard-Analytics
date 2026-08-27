import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Medal } from 'lucide-react';
import { useTopProducts } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';

const ProductPodium = lazy(() => import('../three/ProductPodium.jsx'));

const MEDAL = ['text-warning', 'text-fg-2', 'text-pink'];

/** The 3D top-3 podium, driven by /api/products/top. */
export default function PodiumSection() {
  const { data } = useTopProducts({ limit: 3, by: 'revenue' });
  const rows = Array.isArray(data) ? data.slice(0, 3) : [];

  return (
    <section className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div className="glass order-2 overflow-hidden rounded-3xl p-2 lg:order-1">
          <Suspense fallback={<div className="shimmer h-[300px] rounded-2xl md:h-[360px]" />}>
            <ProductPodium products={rows} height={360} className="h-[300px] md:h-[360px]" />
          </Suspense>
        </div>

        <div className="order-1 lg:order-2">
          <p className="eyebrow mb-2">Winners, at a glance</p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-fg md:text-4xl">
            Know your <span className="text-gradient">best sellers</span> without reading a table.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-fg-2 md:text-base">
            Revenue becomes height. The podium rises from your live catalog, so the shape of the
            leaderboard changes as the data does.
          </p>

          <ol className="mt-6 space-y-2.5">
            {rows.map((pr, i) => (
              <li key={pr.id} className="flex items-center gap-3 text-sm">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-line/10 text-xs font-bold ${MEDAL[i]}`}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-fg">{pr.title}</span>
                <span className="shrink-0 text-[11px] text-fg-3">{fmtNumber(pr.units)} units</span>
                <span className="tabular shrink-0 font-semibold text-fg">{fmtMoney(pr.revenue)}</span>
              </li>
            ))}
            {rows.length === 0 && <li className="text-sm text-fg-3">Loading catalog…</li>}
          </ol>

          <Link to="/products" className="btn-ghost mt-7">
            <Medal size={15} /> See product performance <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
