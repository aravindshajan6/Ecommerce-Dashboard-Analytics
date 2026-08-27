import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { createTimeline, stagger, utils } from 'animejs';
import { useAnimeScope, useCountUp } from '../../hooks/useAnime.js';
import { useHealth, useMeta, useSummary } from '../../hooks/useApi.js';
import { useRange } from '../../lib/range.jsx';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { prefersReducedMotion } from '../../lib/motion.js';

const HeroScene = lazy(() => import('../three/HeroScene.jsx'));

const LINES = [
  { text: 'See your store', gradient: false },
  { text: 'in a new dimension.', gradient: true },
];

function Stat({ label, value, format, loading, title }) {
  const ref = useCountUp(loading ? null : value, { format, duration: 1600 });
  return (
    <div className="hero-stat flex flex-col gap-0.5" style={{ opacity: 0 }} title={title}>
      <span className="font-display text-2xl font-semibold tabular leading-none text-fg md:text-[28px]" ref={ref} aria-live="polite">
        {value != null ? format(value) : loading ? '···' : '—'}
      </span>
      <span className="text-[11px] uppercase tracking-[0.12em] text-fg-3">{label}</span>
    </div>
  );
}

function SceneFallback({ className }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgb(var(--primary)/0.35),transparent_70%)] blur-2xl" />
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,rgb(var(--primary)),rgb(var(--teal)),rgb(var(--pink)),rgb(var(--primary)))] opacity-70 blur-xl" />
    </div>
  );
}

export default function Hero() {
  const { data: meta, isPending: metaPending } = useMeta();
  const { data: summary, isPending: summaryPending } = useSummary();
  const { data: health } = useHealth();
  const { range, rangeLabel } = useRange();

  const root = useAnimeScope((_, el) => {
    const targets = el.querySelectorAll('.hero-eyebrow, .hero-line, .hero-sub, .hero-cta, .hero-stat, .hero-note, .hero-scene');
    if (prefersReducedMotion()) { utils.set(targets, { opacity: 1, translateY: 0 }); return; }
    const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 900 } });
    tl.add('.hero-scene', { opacity: [0, 1], scale: [0.94, 1], duration: 1600 }, 0)
      .add('.hero-eyebrow', { opacity: [0, 1], translateY: [12, 0], duration: 600 }, 150)
      .add('.hero-line', { opacity: [0, 1], translateY: [56, 0], duration: 1100, delay: stagger(120) }, '-=350')
      .add('.hero-sub', { opacity: [0, 1], translateY: [14, 0] }, '-=800')
      .add('.hero-cta', { opacity: [0, 1], translateY: [14, 0], delay: stagger(80) }, '-=750')
      .add('.hero-stat', { opacity: [0, 1], translateY: [18, 0], delay: stagger(90) }, '-=700')
      .add('.hero-note', { opacity: [0, 1], duration: 600 }, '-=500');
  });

  const source = health?.source === 'mongodb' ? 'computed live from MongoDB' : 'computed live from the demo dataset';

  return (
    <section ref={root} className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-10 px-4 pb-16 pt-32 md:px-6 md:pt-40 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-6 xl:col-span-6">
        <p className="hero-eyebrow eyebrow inline-flex items-center gap-2 !text-primary" style={{ opacity: 0 }}>
          <span className="live-dot" /> E-commerce analytics, reimagined
        </p>
        <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.02em] text-fg sm:text-[56px] lg:text-[64px] xl:text-[72px]">
          {LINES.map((l) => (
            <span key={l.text} className="nc-line-mask">
              <span className={`hero-line inline-block ${l.gradient ? 'text-gradient' : ''}`} style={{ opacity: 0 }}>{l.text}</span>
            </span>
          ))}
        </h1>
        <p className="hero-sub mt-6 max-w-xl text-base leading-relaxed text-fg-2 md:text-lg" style={{ opacity: 0 }}>
          Nova Commerce turns raw orders into a living picture of your business — revenue intelligence, cohort retention,
          RFM segments, forecasting and a 3D order globe, narrated by auto-generated insights.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/overview" className="hero-cta btn-primary !px-5 !py-2.5 !text-[15px]" style={{ opacity: 0 }}>
            Explore the dashboard <ArrowRight size={16} />
          </Link>
          <a href="#demo" className="hero-cta btn-ghost !px-5 !py-2.5 !text-[15px]" style={{ opacity: 0 }}>
            View live demo <ArrowDown size={15} />
          </a>
        </div>

        <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line/10 pt-6">
          <Stat label="Orders" value={meta?.counts?.orders} format={(v) => fmtNumber(v)} loading={metaPending} />
          <Stat label="Customers" value={meta?.counts?.customers} format={(v) => fmtNumber(v)} loading={metaPending} />
          <Stat label={`Revenue · ${range}`} title={rangeLabel} value={summary?.kpis?.revenue?.value} format={(v) => fmtMoney(v)} loading={summaryPending} />
        </div>
        <p className="hero-note mt-3 text-[11px] text-fg-3" style={{ opacity: 0 }}>
          Numbers above are {source}{meta?.storeName ? ` · ${meta.storeName}` : ''}.
        </p>
      </div>

      <div className="hero-scene relative lg:col-span-6" style={{ opacity: 0 }}>
        <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--primary)/0.25),transparent_70%)] blur-3xl" aria-hidden="true" />
        <Suspense fallback={<SceneFallback className="h-[420px] md:h-[560px]" />}>
          <HeroScene className="h-[420px] md:h-[560px]" />
        </Suspense>
      </div>
    </section>
  );
}
