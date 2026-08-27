import clsx from 'clsx';

export function Skeleton({ className, style }) {
  return <div className={clsx('shimmer rounded-lg', className)} style={style} aria-hidden="true" />;
}

/** Chart-sized skeleton with fake bars so tiles keep their final height (no layout shift). */
export function ChartSkeleton({ height = 260, bars = 14 }) {
  return (
    <div className="flex items-end gap-2 w-full" style={{ height }} aria-busy="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className="shimmer flex-1 rounded-md" style={{ height: `${25 + ((i * 37) % 60)}%` }} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-2.5 py-1" aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4" style={{ flex: c === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
