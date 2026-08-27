import { useEffect, useMemo } from 'react';
import { animate, stagger, utils } from 'animejs';
import { Link } from 'react-router-dom';
import { ArrowRight, Grid3x3, Repeat, Users } from 'lucide-react';
import { prefersReducedMotion } from '../../lib/motion.js';
import useInViewOnce from './useInViewOnce.js';

const COLS = 12;
const ROWS = 7;

/** A retention curve that decays with month index and varies per cohort — shaped like the real thing. */
function buildMatrix() {
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    const strength = 0.72 + ((r * 37) % 23) / 100; // deterministic per-row variation
    for (let c = 0; c < COLS; c++) {
      const v = c === 0 ? 1 : Math.max(0, strength * Math.pow(0.72, c) + (((r * 7 + c * 13) % 11) - 5) / 160);
      cells.push({ r, c, v: Math.min(1, Math.max(0, v)) });
    }
  }
  return cells;
}

/** teal → indigo → pink, matching the dashboard's cohort heatmap. */
function cellColor(v) {
  if (v <= 0.02) return 'rgb(var(--line) / 0.06)';
  const a = 0.18 + v * 0.72;
  if (v > 0.66) return `rgb(var(--pink) / ${a})`;
  if (v > 0.33) return `rgb(var(--primary) / ${a})`;
  return `rgb(var(--teal) / ${a})`;
}

/**
 * Showcase for cohort retention. The matrix fills in using anime.js `stagger` with its `grid`
 * option, so the animation propagates outward from the first cohort the way the data reads —
 * then a slow shimmer keeps it alive.
 */
export default function CohortShowcase() {
  const [ref, seen] = useInViewOnce({ threshold: 0.2 });
  const cells = useMemo(buildMatrix, []);

  useEffect(() => {
    if (!seen || !ref.current) return undefined;
    const targets = ref.current.querySelectorAll('.nc-cell');
    if (!targets.length) return undefined;

    if (prefersReducedMotion()) {
      utils.set(targets, { opacity: 1, scale: 1 });
      return undefined;
    }

    utils.set(targets, { opacity: 0, scale: 0.35 });
    const intro = animate(targets, {
      opacity: [0, 1],
      scale: [0.35, 1],
      duration: 620,
      ease: 'outBack',
      // grid-aware stagger: the wave travels out from the first cohort / first month
      delay: stagger(26, { grid: [COLS, ROWS], from: 'first' }),
    });

    // gentle breathing pass once the grid has landed
    const shimmer = animate(targets, {
      opacity: [{ to: 0.72, duration: 900 }, { to: 1, duration: 900 }],
      delay: stagger(55, { grid: [COLS, ROWS], from: 'center' }),
      loop: true,
      autoplay: false,
    });
    const t = setTimeout(() => shimmer.play(), 1700);

    return () => { clearTimeout(t); intro.pause?.(); shimmer.pause?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="eyebrow mb-2">Retention, not just revenue</p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-fg md:text-4xl">
            See which month&rsquo;s customers <span className="text-gradient">actually came back</span>.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-fg-2 md:text-base">
            Every customer is bucketed by the month of their first purchase, then tracked forward. The matrix
            shows what share of each cohort ordered again — so a good month and a month that only looked good
            stop being the same thing.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              { icon: Grid3x3, text: 'Cohort retention matrix, switchable to a 3D surface' },
              { icon: Repeat, text: 'Repeat-purchase rate and lifetime value per cohort' },
              { icon: Users, text: 'Ten RFM segments, from Champions to Hibernating' },
            ].map((f) => (
              <li key={f.text} className="flex items-start gap-3 text-sm text-fg-2">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <f.icon size={13} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
          <Link to="/customers" className="btn-primary mt-7">
            Explore cohorts <ArrowRight size={15} />
          </Link>
        </div>

        <div className="glass rounded-3xl p-5 md:p-6">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-xs font-semibold text-fg">Retention by cohort</p>
            <p className="text-[11px] text-fg-3">M0 → M11</p>
          </div>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {cells.map((c) => (
              <span
                key={`${c.r}-${c.c}`}
                className="nc-cell aspect-square rounded-[4px]"
                style={{ background: cellColor(c.v) }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-fg-3">
            <span>Low</span>
            <span className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-teal via-primary to-pink" />
            <span>High</span>
          </div>
        </div>
      </div>
    </section>
  );
}
