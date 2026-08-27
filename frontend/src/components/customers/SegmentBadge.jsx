import { segmentColor, segmentTint } from './segments.js';

/** Pill colored per RFM segment (Badge only knows order/product tones). */
export default function SegmentBadge({ segment, className = '' }) {
  if (!segment) return <span className="pill bg-line/10 text-fg-3">—</span>;
  return (
    <span className={`pill whitespace-nowrap ${className}`} style={{ background: segmentTint(segment, 18), color: segmentColor(segment) }}>
      {segment}
    </span>
  );
}
