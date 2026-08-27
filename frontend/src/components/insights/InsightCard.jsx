import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { AlertTriangle, ArrowRight, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { animate, stagger } from 'animejs';
import DeltaPill from '../ui/DeltaPill.jsx';
import { fmtMoney, fmtNumber, fmtPct } from '../../lib/format.js';
import { prefersReducedMotion } from '../../lib/motion.js';

const TYPES = {
  positive: { icon: TrendingUp, rail: 'bg-success', chip: 'bg-success/15 text-success', label: 'Positive' },
  negative: { icon: TrendingDown, rail: 'bg-danger', chip: 'bg-danger/15 text-danger', label: 'Negative' },
  neutral: { icon: Info, rail: 'bg-primary', chip: 'bg-primary/15 text-primary', label: 'Insight' },
  alert: { icon: AlertTriangle, rail: 'bg-warning', chip: 'bg-warning/15 text-warning', label: 'Alert' },
};

/** Format an insight's metric value based on the metric name. */
function formatMetric(metric = '', value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const m = String(metric).toLowerCase();
  if (/revenue|aov|ltv|spent|sales/.test(m)) return fmtMoney(Number(value));
  if (/rate|share|pct|percent/.test(m)) {
    const v = Number(value);
    return fmtPct(Math.abs(v) <= 1 ? v * 100 : v);
  }
  return fmtNumber(Number(value), { compact: Math.abs(Number(value)) >= 100_000 });
}

/**
 * Glass mini-card for one auto-generated insight.
 * insight = { id, type, title, body, metric, value, delta, href }
 * `typewriter` (optional) reveals the title char-by-char — used by InsightsPanel on the first card only.
 */
export default function InsightCard({ insight, index = 0, compact = false, typewriter = false }) {
  const ref = useRef(null);
  const t = TYPES[insight?.type] || TYPES.neutral;
  const Icon = t.icon;
  const value = formatMetric(insight?.metric, insight?.value);
  const hasDelta = typeof insight?.delta === 'number' && !Number.isNaN(insight.delta);

  // Entrance, staggered by index. Cleaned up on unmount.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) { el.style.opacity = 1; return undefined; }
    const anim = animate(el, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 700,
      delay: Math.min(index, 8) * 70,
      ease: 'outExpo',
    });
    let chars = null;
    if (typewriter) {
      const spans = el.querySelectorAll('[data-char]');
      if (spans.length) {
        chars = animate(spans, {
          opacity: [0, 1],
          duration: 200,
          delay: stagger(Math.min(18, 900 / spans.length), { start: 150 + Math.min(index, 8) * 70 }),
          ease: 'linear',
        });
      }
    }
    return () => { anim.pause(); chars?.pause(); };
  }, [index, typewriter, insight?.id]);

  const title = insight?.title || '';

  return (
    <article
      ref={ref}
      className={clsx('glass spot group relative overflow-hidden', compact ? 'min-h-[72px] p-3 pl-4' : 'min-h-[112px] p-4 pl-5')}
      style={{ opacity: 0 }}
      data-type={insight?.type}
      aria-label={`${t.label}: ${title}`}
    >
      <span className={clsx('absolute inset-y-3 left-0 w-[3px] rounded-r-full', t.rail)} aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className={clsx('grid shrink-0 place-items-center rounded-xl', t.chip, compact ? 'h-8 w-8' : 'h-9 w-9')}>
          <Icon size={compact ? 15 : 17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h4 className={clsx('font-display font-semibold leading-snug text-fg', compact ? 'text-[13px]' : 'text-sm')}>
              {typewriter
                ? Array.from(title).map((ch, i) => (
                  <span key={i} data-char="" style={{ opacity: 0 }} aria-hidden="true">{ch}</span>
                ))
                : title}
              {typewriter && <span className="sr-only">{title}</span>}
            </h4>
            {value != null && (
              <span className={clsx('kpi-number shrink-0 !text-base md:!text-lg text-fg', compact && '!text-sm md:!text-base')}>{value}</span>
            )}
          </div>
          {!compact && insight?.body && <p className="mt-1 text-xs leading-relaxed text-fg-2">{insight.body}</p>}
          <div className={clsx('flex items-center justify-between gap-2', compact ? 'mt-1.5' : 'mt-2.5')}>
            <div className="flex items-center gap-2">
              {hasDelta ? <DeltaPill value={insight.delta} invert={/refund|churn|stockout|out of stock/i.test(insight.metric || '')} /> : <span className={clsx('pill', t.chip)}>{t.label}</span>}
              {insight?.metric && <span className="truncate text-[11px] capitalize text-fg-3">{String(insight.metric).replace(/[_-]/g, ' ')}</span>}
            </div>
            {insight?.href && (
              <Link to={insight.href} className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary transition-transform group-hover:translate-x-0.5 hover:underline">
                View <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
