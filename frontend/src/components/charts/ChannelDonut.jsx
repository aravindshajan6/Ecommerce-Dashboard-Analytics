import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Radio } from 'lucide-react';
import { GlassCard } from '../ui/index.js';
import { useSalesChannels } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber, fmtPct } from '../../lib/format.js';
import { SERIES } from './theme.js';
import ChartTooltip from './ChartTooltip.jsx';
import QueryState from './QueryState.jsx';

const nice = (s = '') => s.replace(/_/g, ' ');

function Donut({ data, height }) {
  const { rows, total } = useMemo(() => {
    const rows = [...data].sort((a, b) => b.revenue - a.revenue);
    const total = rows.reduce((s, r) => s + (r.revenue || 0), 0);
    return { rows: rows.map((r) => ({ ...r, pct: total ? (r.revenue / total) * 100 : 0 })), total };
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={rows} dataKey="revenue" nameKey="channel" innerRadius="66%" outerRadius="92%" paddingAngle={3} cornerRadius={5} stroke="none">
              {rows.map((r, i) => <Cell key={r.channel} fill={SERIES[i % SERIES.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip format={(v) => fmtMoney(v, { full: true })} labelFormat={(_, p) => nice(p?.[0]?.name)} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="eyebrow">Total</p>
          <p className="font-display text-xl font-semibold text-fg">{fmtMoney(total)}</p>
          <p className="text-[11px] text-fg-3">{rows.length} channels</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {rows.map((r, i) => (
          <li key={r.channel}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
                <span className="truncate capitalize text-fg-2">{nice(r.channel)}</span>
                <span className="text-fg-3">· {fmtNumber(r.orders)} orders</span>
              </span>
              <span className="tabular shrink-0 text-fg">{fmtMoney(r.revenue)} <span className="text-fg-3">{fmtPct(r.pct)}</span></span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/10">
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${r.pct}%`, background: SERIES[i % SERIES.length] }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Revenue share by sales channel. Data: /api/sales/channels. */
export default function ChannelDonut({ className, height = 190 }) {
  const q = useSalesChannels();
  return (
    <GlassCard title="Channels" subtitle="Revenue share by source" icon={Radio} className={className}>
      <QueryState query={q} height={height + 120}>{(data) => <Donut data={data} height={height} />}</QueryState>
    </GlassCard>
  );
}
