import { Medal } from 'lucide-react';
import { GlassCard } from '../ui/index.js';
import { useTopProducts } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import ProductPodium from '../three/ProductPodium.jsx';
import QueryState from '../charts/QueryState.jsx';

const MEDAL = ['text-warning', 'text-fg-2', 'text-pink'];

/** 3D podium of the top 3 products by revenue. Data: /api/products/top?limit=3&by=revenue. */
export default function PodiumCard({ className, height = 280 }) {
  const q = useTopProducts({ limit: 3, by: 'revenue' });
  return (
    <GlassCard title="Product podium" subtitle="Top 3 by revenue" icon={Medal} className={className}>
      <QueryState query={q} height={height}>
        {(rows) => (
          <div className="flex flex-col gap-3">
            <ProductPodium products={rows.slice(0, 3)} height={height} />
            <ol className="space-y-1.5">
              {rows.slice(0, 3).map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full bg-line/10 text-xs font-bold ${MEDAL[i]}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-fg">{p.title}</span>
                  <span className="shrink-0 text-[11px] text-fg-3">{fmtNumber(p.units)} units</span>
                  <span className="tabular shrink-0 font-semibold text-fg">{fmtMoney(p.revenue)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </QueryState>
    </GlassCard>
  );
}
