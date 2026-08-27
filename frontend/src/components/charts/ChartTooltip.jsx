/** Glass tooltip for Recharts. Pass `format={(value, name) => string}` and optional `labelFormat`. */
export default function ChartTooltip({ active, payload, label, format = (v) => v, labelFormat = (l) => l }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass !rounded-xl px-3 py-2 text-xs shadow-xl" style={{ '--glass-alpha': 0.92 }}>
      <p className="mb-1 font-medium text-fg">{labelFormat(label, payload)}</p>
      <ul className="space-y-0.5">
        {payload.filter((p) => p.value != null).map((p) => (
          <li key={p.dataKey ?? p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-fg-2">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill || p.stroke }} />
              {p.name}
            </span>
            <span className="tabular font-medium text-fg">{format(p.value, p.name, p)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
