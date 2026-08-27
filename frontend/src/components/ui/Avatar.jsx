import { hueFor, initials } from '../../lib/format.js';

export default function Avatar({ name, size = 32, className = '' }) {
  const h = hueFor(name || '');
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${(h + 50) % 360} 70% 45%))` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
