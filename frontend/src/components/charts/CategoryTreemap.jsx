import { useMemo } from 'react';
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import { LayoutGrid } from 'lucide-react';
import { GlassCard } from '../ui/index.js';
import { useSalesCategories } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber, fmtPct } from '../../lib/format.js';
import { SERIES } from './theme.js';
import ChartTooltip from './ChartTooltip.jsx';
import QueryState from './QueryState.jsx';
import { truncate } from './series.js';

function TreemapCell({ x, y, width, height, index, name, value, depth }) {
  if (depth < 1 || width <= 2 || height <= 2) return null;
  const color = SERIES[index % SERIES.length];
  const showLabel = width > 70 && height > 44;
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} rx={8} ry={8} fill={color} fillOpacity={0.82} />
      {showLabel && (
        <>
          <text x={x + 10} y={y + 20} fill="#fff" fontSize={12} fontWeight={600}>{truncate(name, Math.floor((width - 16) / 7))}</text>
          <text x={x + 10} y={y + 36} fill="rgba(255,255,255,0.82)" fontSize={11}>{fmtMoney(value)}</text>
        </>
      )}
    </g>
  );
}

const tipFormat = (v, _n, p) => `${fmtMoney(v, { full: true })}${p?.payload?.share != null ? ` · ${fmtPct(p.payload.share * 100)}` : ''}`;
const tipLabel = (_, p) => p?.[0]?.payload?.name ?? p?.[0]?.name ?? '';

/** Revenue by category. Data: /api/sales/categories. */
export default function CategoryTreemap({ className, height = 300 }) {
  const q = useSalesCategories();
  const data = useMemo(
    () => (q.data ?? []).filter((c) => c.revenue > 0).sort((a, b) => b.revenue - a.revenue)
      .map((c) => ({ name: c.category, size: c.revenue, share: c.share, units: c.units, orders: c.orders })),
    [q.data],
  );
  return (
    <GlassCard title="Categories" subtitle="Revenue by product category" icon={LayoutGrid} className={className}>
      <QueryState query={q} height={height}>
        {() => (
          <div>
            <div style={{ height }}>
              <ResponsiveContainer width="100%" height={height}>
                <Treemap data={data} dataKey="size" nameKey="name" aspectRatio={4 / 3} stroke="none" content={<TreemapCell />}>
                  <Tooltip content={<ChartTooltip format={tipFormat} labelFormat={tipLabel} />} />
                </Treemap>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-fg-2">
              {data.slice(0, 6).map((c, i) => (
                <li key={c.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} />
                  <span className="truncate">{c.name}</span>
                  <span className="tabular text-fg-3">{fmtNumber(c.units, { compact: true })} units</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </QueryState>
    </GlassCard>
  );
}
