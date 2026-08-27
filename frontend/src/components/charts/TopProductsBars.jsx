import { useId, useState } from 'react';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Trophy } from 'lucide-react';
import { GlassCard, Segmented } from '../ui/index.js';
import { useTopProducts } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { C, axisProps } from './theme.js';
import ChartTooltip from './ChartTooltip.jsx';
import QueryState from './QueryState.jsx';
import { svgId, truncate } from './series.js';

const BY = [{ value: 'revenue', label: 'Revenue' }, { value: 'units', label: 'Units' }];

/** Horizontal bars of the top products. Data: /api/products/top?by=revenue|units. */
export default function TopProductsBars({ className, limit = 6, height = 260 }) {
  const [by, setBy] = useState('revenue');
  const q = useTopProducts({ limit, by });
  const gid = svgId(useId());
  const fmt = (v) => (by === 'revenue' ? fmtMoney(v) : fmtNumber(v, { compact: true }));
  const fmtFull = (v) => (by === 'revenue' ? fmtMoney(v, { full: true }) : fmtNumber(v));

  return (
    <GlassCard title="Top products" subtitle={`Best sellers by ${by}`} icon={Trophy} className={className}
      action={<Segmented size="xs" options={BY} value={by} onChange={setBy} />}>
      <QueryState query={q} height={height}>
        {(rows) => (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, left: 0, bottom: 4 }} barCategoryGap={10}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.primary} />
                    <stop offset="100%" stopColor={C.violet} />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="title" {...axisProps} width={112} tickFormatter={(t) => truncate(t, 16)} interval={0} />
                <Tooltip content={<ChartTooltip format={fmtFull} />} cursor={{ fill: 'rgb(var(--line) / 0.05)' }} />
                <Bar dataKey={by} name={by === 'revenue' ? 'Revenue' : 'Units'} fill={`url(#${gid})`} radius={[0, 6, 6, 0]} maxBarSize={22}>
                  <LabelList dataKey={by} position="right" formatter={fmt} style={{ fill: C.fg3, fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </QueryState>
    </GlassCard>
  );
}
