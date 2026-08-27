import { useEffect, useRef, useState } from 'react';
import { animate, utils } from 'animejs';
import { ChevronDown } from 'lucide-react';
import { prefersReducedMotion } from '../../lib/motion.js';
import Reveal from './Reveal.jsx';

const FAQS = [
  {
    q: 'Do I need a database to try it?',
    a: 'No. With no MONGODB_URI set, the API serves a deterministic demo dataset — roughly 9,000 orders, 1,500 customers and 60 products spanning three years, with real seasonality and growth baked in. Every chart, cohort and segment works out of the box.',
  },
  {
    q: 'What data does it expect?',
    a: 'The three Shopify-shaped collections: shopifyOrders, shopifyCustomers and shopifyProducts. Point MONGODB_URI at them and the API loads and normalises them on boot, refreshing on an interval. You can also run the seed script to push the demo dataset into your own database.',
  },
  {
    q: 'Why is there no conversion rate or customer acquisition cost?',
    a: 'Both need traffic and ad-spend data, which order, customer and product collections simply do not contain. Rather than invent plausible-looking numbers, those metrics are left out. Everything shown is derived from data that actually exists.',
  },
  {
    q: 'How much should I trust the forecast?',
    a: 'It is a Holt linear-trend projection over a seasonally adjusted monthly series, shown with a confidence band. Treat it as directional — a sense of where the trend is heading, not a commitment.',
  },
  {
    q: 'Is the live order feed really live?',
    a: 'It polls the most recent orders every 15 seconds and animates new rows in as they appear. There is no websocket stream behind it, and the panel says so rather than implying otherwise.',
  },
  {
    q: 'What happens without WebGL, or with reduced motion?',
    a: 'Every 3D scene is wrapped in an error boundary and swaps to a static on-brand gradient when WebGL is unavailable or the visitor prefers reduced motion. Animations shorten to near-zero and the dashboard stays fully usable.',
  },
];

function FaqItem({ q, a, open, onToggle, id }) {
  const bodyRef = useRef(null);
  const firstRun = useRef(true);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    if (prefersReducedMotion() || firstRun.current) {
      firstRun.current = false;
      el.style.height = open ? 'auto' : '0px';
      el.style.opacity = open ? '1' : '0';
      return;
    }

    utils.remove(el); // cancel any in-flight open/close so rapid toggling stays correct
    if (open) {
      const target = el.scrollHeight;
      el.style.height = '0px';
      animate(el, {
        height: target,
        opacity: [0, 1],
        duration: 380,
        ease: 'outQuad',
        onComplete: () => { el.style.height = 'auto'; },
      });
    } else {
      el.style.height = `${el.scrollHeight}px`;
      animate(el, { height: 0, opacity: 0, duration: 260, ease: 'inQuad' });
    }
  }, [open]);

  return (
    <div className="glass spot overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`faq-body-${id}`}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-fg md:text-[15px]">{q}</span>
        <ChevronDown
          size={17}
          className="shrink-0 text-fg-3 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      <div ref={bodyRef} id={`faq-body-${id}`} style={{ height: 0, opacity: 0 }}>
        <p className="px-5 pb-5 text-sm leading-relaxed text-fg-2">{a}</p>
      </div>
    </div>
  );
}

/** Accordion FAQ — anime.js animates the panel height, and utils.remove keeps rapid toggles honest. */
export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-5 py-16 md:py-24">
      <div className="mb-10 text-center">
        <p className="eyebrow mb-2">Straight answers</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-fg md:text-4xl">
          The questions worth <span className="text-gradient">asking first</span>.
        </h2>
      </div>
      <Reveal className="space-y-3" each={70} y={16}>
        {FAQS.map((f, i) => (
          <FaqItem
            key={f.q}
            id={i}
            q={f.q}
            a={f.a}
            open={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </Reveal>
    </section>
  );
}
