import { Coins, Package, Receipt, Repeat, RotateCcw, ShoppingBag, UserPlus, Users } from 'lucide-react';
import { KpiCard } from '../ui/index.js';
import { useReveal } from '../../hooks/useAnime.js';
import { fmtMoney, fmtNumber, fmtPct } from '../../lib/format.js';

const pct = (v) => fmtPct(v * 100);
const num = (v) => fmtNumber(v);

const KPIS = [
  { key: 'revenue', label: 'Revenue', icon: Coins, format: fmtMoney, tone: 'primary' },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, format: num, tone: 'teal' },
  { key: 'customers', label: 'Customers', icon: Users, format: num, tone: 'violet' },
  { key: 'newCustomers', label: 'New customers', icon: UserPlus, format: num, tone: 'pink' },
  { key: 'aov', label: 'Avg order value', icon: Receipt, format: fmtMoney, tone: 'primary' },
  { key: 'unitsSold', label: 'Units sold', icon: Package, format: num, tone: 'teal' },
  { key: 'repeatRate', label: 'Repeat rate', icon: Repeat, format: pct, tone: 'violet' },
  { key: 'refundRate', label: 'Refund rate', icon: RotateCcw, format: pct, tone: 'warning', invert: true },
];

/** 8 KPI tiles from /api/summary (nested 12-col grid so spans work). `keys` limits which KPIs render. */
export default function KpiGrid({ query, keys, span = 'col-span-6 md:col-span-4 xl:col-span-3', className = 'col-span-12' }) {
  const ref = useReveal(true, { each: 60, y: 14 });
  const items = keys ? KPIS.filter((k) => keys.includes(k.key)) : KPIS;
  const kpis = query.data?.kpis;
  return (
    <div ref={ref} className={`grid grid-cols-12 gap-4 ${className}`}>
      {items.map((k) => (
        <KpiCard key={k.key} className={span} label={k.label} icon={k.icon} kpi={kpis?.[k.key]} format={k.format} tone={k.tone} invert={k.invert}
          loading={query.isPending} hint={query.isError ? 'unavailable' : undefined} />
      ))}
    </div>
  );
}
