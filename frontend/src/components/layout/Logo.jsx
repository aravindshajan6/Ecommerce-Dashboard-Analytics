/** Brand mark: animated gradient stroke line-chart glyph. */
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="nova-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset=".5" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="rgb(var(--panel))" stroke="rgb(var(--line) / 0.12)" />
      <path d="M18 44 L30 20 L38 36 L46 26" fill="none" stroke="url(#nova-g)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="46" cy="26" r="4" fill="#2DD4BF" />
    </svg>
  );
}
