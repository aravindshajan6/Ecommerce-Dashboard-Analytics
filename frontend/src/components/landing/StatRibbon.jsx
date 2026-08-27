import { useEffect, useRef } from 'react';
import { animate, stagger, svg, utils } from 'animejs';
import { Boxes, Globe2, ShoppingBag, Users } from 'lucide-react';
import { useGeo, useMeta } from '../../hooks/useApi.js';
import { fmtNumber } from '../../lib/format.js';
import { countUp, prefersReducedMotion } from '../../lib/motion.js';
import useInViewOnce from './useInViewOnce.js';

const RING_R = 26;
const CIRC = 2 * Math.PI * RING_R;

/**
 * "By the numbers" band. Each stat draws its progress ring with anime.js `svg.createDrawable`
 * and counts its value up, once the band scrolls into view. Values are live from the API.
 */
export default function StatRibbon() {
  const [ref, seen] = useInViewOnce();
  const { data: meta } = useMeta();
  const { data: geo } = useGeo();
  const numRefs = useRef([]);

  const stats = [
    { key: 'orders', icon: ShoppingBag, label: 'Orders analysed', value: meta?.counts?.orders, tone: 'rgb(var(--primary))', fill: 0.92 },
    { key: 'customers', icon: Users, label: 'Customers tracked', value: meta?.counts?.customers, tone: 'rgb(var(--teal))', fill: 0.78 },
    { key: 'products', icon: Boxes, label: 'Products in catalog', value: meta?.counts?.products, tone: 'rgb(var(--violet))', fill: 0.64 },
    { key: 'cities', icon: Globe2, label: 'Cities reached', value: geo?.points?.length, tone: 'rgb(var(--pink))', fill: 0.55 },
  ];

  useEffect(() => {
    if (!seen || !ref.current) return undefined;
    const root = ref.current;
    const rings = root.querySelectorAll('.nc-ring-path');
    const anims = [];

    if (prefersReducedMotion()) {
      utils.set(rings, { opacity: 1 });
    } else if (rings.length) {
      // draw each ring arc clockwise from 12 o'clock
      anims.push(animate(svg.createDrawable(rings), {
        draw: ['0 0', '0 1'],
        duration: 1300,
        delay: stagger(130),
        ease: 'inOutQuad',
      }));
    }

    stats.forEach((s, i) => {
      const el = numRefs.current[i];
      if (el && s.value != null) {
        anims.push(countUp(el, s.value, { duration: 1500, delay: i * 130, format: (v) => fmtNumber(v) }));
      }
    });
    return () => anims.forEach((a) => a?.pause?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, meta?.counts?.orders, geo?.points?.length]);

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="glass grid grid-cols-2 gap-6 rounded-3xl px-6 py-8 md:grid-cols-4 md:px-10">
        {stats.map((s, i) => (
          <div key={s.key} className="flex flex-col items-center text-center">
            <div className="relative mb-3 grid h-[64px] w-[64px] place-items-center">
              <svg width="64" height="64" viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
                <circle cx="32" cy="32" r={RING_R} fill="none" stroke="rgb(var(--line) / 0.12)" strokeWidth="3" />
                <circle
                  className="nc-ring-path"
                  cx="32" cy="32" r={RING_R}
                  fill="none" stroke={s.tone} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${CIRC * s.fill} ${CIRC}`}
                />
              </svg>
              <s.icon size={22} style={{ color: s.tone }} />
            </div>
            <p
              ref={(el) => { numRefs.current[i] = el; }}
              className="kpi-number text-fg"
            >
              {s.value != null ? fmtNumber(s.value) : '—'}
            </p>
            <p className="mt-1 text-xs text-fg-3">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
