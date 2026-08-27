import { Crown } from 'lucide-react';
import { Badge, EmptyState, ErrorState, GlassCard, Skeleton, Sparkline } from '../ui/index.js';
import { useCountUp } from '../../hooks/useAnime.js';
import { fmtMoney, fmtNumber, fmtPct } from '../../lib/format.js';

/** #1 product card. `product` is the first row from /api/products/top; `totalRevenue` from /api/summary for the share. */
export default function ProductSpotlight({ product, by = 'revenue', totalRevenue, loading, error, retry, className }) {
  const share = product && totalRevenue ? (product.revenue / totalRevenue) * 100 : null;
  const revRef = useCountUp(product?.revenue, { format: (v) => fmtMoney(v) });
  const unitsRef = useCountUp(product?.units, { format: (v) => fmtNumber(Math.round(v)) });

  let body;
  if (loading) {
    body = (
      <div className="flex h-full flex-col justify-between gap-4" aria-busy="true">
        <div><Skeleton className="h-7 w-3/4" /><Skeleton className="mt-2 h-4 w-1/3" /></div>
        <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        <Skeleton className="h-11 w-full" />
      </div>
    );
  } else if (error) body = <ErrorState error={error} retry={retry} />;
  else if (!product) body = <EmptyState icon={Crown} title="No product to spotlight" body="Top products appear once there are sales in this range." />;
  else {
    body = (
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="min-w-0">
          <h4 className="font-display text-2xl font-semibold leading-tight text-fg line-clamp-2" title={product.title}>{product.title}</h4>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-fg-3">
            {product.category && <Badge tone="category">{product.category}</Badge>}
            {product.vendor && <span>{product.vendor}</span>}
            {product.status && <Badge>{product.status}</Badge>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="eyebrow">Revenue</p>
            <p ref={revRef} className="tabular mt-1 font-display text-xl font-semibold text-fg">{fmtMoney(product.revenue)}</p>
          </div>
          <div>
            <p className="eyebrow">Units</p>
            <p ref={unitsRef} className="tabular mt-1 font-display text-xl font-semibold text-fg">{fmtNumber(product.units)}</p>
          </div>
          <div>
            <p className="eyebrow">Share</p>
            <p className="tabular mt-1 font-display text-xl font-semibold text-gradient">{share == null ? '—' : fmtPct(share)}</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 rounded-xl bg-line/5 px-3 py-2">
          <div className="text-[11px] text-fg-3">
            <p>Last 8 periods</p>
            <p className="text-fg-2">{fmtNumber(product.orders)} orders · {fmtMoney(product.price, { full: true })} each</p>
          </div>
          <Sparkline data={product.trend} width={140} height={40} color="rgb(var(--teal))" />
        </div>
      </div>
    );
  }

  return (
    <GlassCard
      className={`min-h-[300px] ${className ?? ''}`}
      gradient={!loading && !!product}
      icon={Crown}
      title="Spotlight"
      subtitle={`#1 product by ${by}`}
      bodyClassName="flex flex-col"
    >
      {body}
    </GlassCard>
  );
}
