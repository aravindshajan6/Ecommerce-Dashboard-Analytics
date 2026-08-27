/**
 * Static stand-in for a 3D scene (reduced motion, WebGL unavailable, or a render error).
 * Uses the same tokens as `.aurora` so it still feels on-brand instead of a grey box.
 */
export default function StaticFallback({ height = '100%', width, className = '', message, rounded = 'rounded-2xl', style, variant = 'gradient' }) {
  const bg = variant === 'gradient'
    ? {
        background: [
          'radial-gradient(60% 55% at 20% 20%, rgb(var(--primary) / 0.35), transparent 65%)',
          'radial-gradient(50% 50% at 80% 30%, rgb(var(--teal) / 0.28), transparent 65%)',
          'radial-gradient(55% 55% at 70% 85%, rgb(var(--pink) / 0.25), transparent 65%)',
          'radial-gradient(45% 45% at 20% 85%, rgb(var(--violet) / 0.28), transparent 65%)',
          'rgb(var(--panel) / 0.6)',
        ].join(','),
      }
    : undefined;
  return (
    <div
      className={`${variant === 'shimmer' ? 'shimmer' : ''} ${rounded} grid place-items-center overflow-hidden ${className}`}
      style={{ height, width, ...bg, ...style }}
      role="img"
      aria-label={message || '3D visual'}
    >
      {message && <span className="text-xs font-medium text-fg-3">{message}</span>}
    </div>
  );
}
