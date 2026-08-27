import { useEffect } from 'react';
import { animate, createTimeline, stagger, utils } from 'animejs';
import { Database, Layers, Sparkles, Target } from 'lucide-react';
import { prefersReducedMotion } from '../../lib/motion.js';
import useInViewOnce from './useInViewOnce.js';

const STEPS = [
  {
    icon: Database,
    title: 'Point it at your data',
    body: 'Set MONGODB_URI to your Shopify collections — or run the bundled demo dataset and skip the database entirely.',
    tone: 'rgb(var(--primary))',
  },
  {
    icon: Layers,
    title: 'Everything gets indexed',
    body: 'Orders, customers and products are normalised into one in-memory model, so every query answers in milliseconds.',
    tone: 'rgb(var(--teal))',
  },
  {
    icon: Sparkles,
    title: 'Insights write themselves',
    body: 'Momentum, anomalies, stockouts and drop-offs are detected and phrased in plain English — no prompts, no templates.',
    tone: 'rgb(var(--violet))',
  },
  {
    icon: Target,
    title: 'Act on what matters',
    body: 'Drill into cohorts, RFM segments, inventory risk and geography, then export what you need.',
    tone: 'rgb(var(--pink))',
  },
];

/**
 * Four-step pipeline. The connecting line draws itself with anime.js `svg.createDrawable`, then the
 * nodes pop and the cards rise — a single timeline fired once the section scrolls into view.
 */
export default function HowItWorks() {
  const [ref, seen] = useInViewOnce({ threshold: 0.15 });

  useEffect(() => {
    if (!seen || !ref.current) return undefined;
    const root = ref.current;
    const line = root.querySelectorAll('.nc-connector');
    const nodes = root.querySelectorAll('.nc-node');
    const cards = root.querySelectorAll('.nc-step');

    if (prefersReducedMotion()) {
      utils.set([...nodes, ...cards], { opacity: 1, translateY: 0, scale: 1 });
      utils.set(line, { opacity: 1 });
      return undefined;
    }

    utils.set(nodes, { opacity: 0, scale: 0.3 });
    utils.set(cards, { opacity: 0, translateY: 22 });

    // Content first: the steps must animate in even if the decorative connector fails for any
    // reason, so nothing about the line can leave the section stuck in its hidden "from" state.
    const tl = createTimeline({ defaults: { ease: 'outExpo' } });
    tl.add(nodes, { opacity: [0, 1], scale: [0.3, 1], duration: 620, delay: stagger(180) }, 200);
    tl.add(cards, { opacity: [0, 1], translateY: [22, 0], duration: 760, delay: stagger(180) }, 360);

    // Then draw the connector by tweening its dash offset, isolated so it cannot break the above.
    const drawAnims = [];
    try {
      line.forEach((el) => {
        const len = typeof el.getTotalLength === 'function' ? el.getTotalLength() : 0;
        if (!len) return;
        utils.set(el, { strokeDasharray: len, strokeDashoffset: len });
        drawAnims.push(animate(el, { strokeDashoffset: [len, 0], duration: 1200, ease: 'inOutQuad' }));
      });
    } catch {
      utils.set(line, { strokeDasharray: 'none', strokeDashoffset: 0 });
    }

    return () => { tl.pause?.(); drawAnims.forEach((a) => a?.pause?.()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  return (
    <section ref={ref} id="how" className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div className="mb-12 max-w-2xl">
        <p className="eyebrow mb-2">How it works</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-fg md:text-4xl">
          From raw orders to <span className="text-gradient">something you can act on</span>.
        </h2>
        <p className="mt-3 text-sm text-fg-2 md:text-base">
          Four steps, no data pipeline to build and nothing to configure before you can see it working.
        </p>
      </div>

      {/* the connector only makes sense on the horizontal (desktop) layout */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-0 right-0 top-[30px] hidden h-3 w-full md:block"
          viewBox="0 0 1000 6" preserveAspectRatio="none" aria-hidden="true"
        >
          <defs>
            <linearGradient id="nc-conn" gradientUnits="userSpaceOnUse" x1="110" y1="0" x2="890" y2="0">
              <stop offset="0%" stopColor="rgb(var(--primary))" />
              <stop offset="45%" stopColor="rgb(var(--teal))" />
              <stop offset="100%" stopColor="rgb(var(--pink))" />
            </linearGradient>
          </defs>
          <line className="nc-connector" x1="110" y1="3" x2="890" y2="3" stroke="url(#nc-conn)" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex flex-col items-center text-center md:items-start md:text-left">
              <span
                className="nc-node relative z-10 mb-5 grid h-[60px] w-[60px] place-items-center rounded-2xl border border-line/10 bg-panel shadow-card"
                style={{ boxShadow: `0 0 0 1px ${s.tone}33, 0 14px 34px -18px ${s.tone}` }}
              >
                <s.icon size={22} style={{ color: s.tone }} />
                <span
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: s.tone }}
                >
                  {i + 1}
                </span>
              </span>
              <div className="nc-step">
                <h3 className="font-display text-base font-semibold text-fg">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
