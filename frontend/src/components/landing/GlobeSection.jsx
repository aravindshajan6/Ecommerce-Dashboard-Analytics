import { Suspense, lazy, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe2, MapPin, Plane } from 'lucide-react';
import { useGeo } from '../../hooks/useApi.js';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import Reveal from './Reveal.jsx';

const Globe = lazy(() => import('../three/Globe.jsx'));

/**
 * The order globe, front and centre on the landing page — the dot-matrix earth with revenue-coloured
 * city markers and arcs, driven by the same /api/customers/geo data the dashboard uses.
 */
export default function GlobeSection() {
  const { data } = useGeo();
  const points = useMemo(() => (Array.isArray(data?.points) ? data.points : []), [data]);

  const top = points.slice(0, 5);
  const countries = useMemo(() => new Set(points.map((p) => p.country).filter(Boolean)).size, [points]);
  const customers = useMemo(() => points.reduce((a, p) => a + (p.customers || 0), 0), [points]);

  return (
    <section className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
        <div>
          <p className="eyebrow mb-2">Every order has an origin</p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-fg md:text-4xl">
            Watch demand land <span className="text-gradient">city by city</span>.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-fg-2 md:text-base">
            Each marker is a city that has ordered — sized by customer count, coloured by revenue, with
            arcs tracing flow from your strongest market. Drag it, or click a city to focus it.
          </p>

          <Reveal className="mt-6 grid grid-cols-3 gap-3" each={90} y={14}>
            {[
              { icon: MapPin, label: 'Cities', value: fmtNumber(points.length) },
              { icon: Globe2, label: 'Countries', value: fmtNumber(countries) },
              { icon: Plane, label: 'Customers', value: fmtNumber(customers) },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl px-3 py-3 text-center">
                <s.icon size={15} className="mx-auto mb-1.5 text-teal" />
                <p className="kpi-number !text-xl text-fg">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-fg-3">{s.label}</p>
              </div>
            ))}
          </Reveal>

          {top.length > 0 && (
            <ul className="mt-6 space-y-2">
              {top.map((c, i) => (
                <li key={`${c.city}-${c.country}`} className="flex items-center gap-3 text-sm">
                  <span className="w-4 shrink-0 text-right text-[11px] text-fg-3">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-fg">
                    {c.city}
                    <span className="text-fg-3"> · {c.country}</span>
                  </span>
                  <span className="tabular shrink-0 text-xs text-fg-2">{fmtNumber(c.customers)}</span>
                  <span className="tabular shrink-0 text-xs font-semibold text-fg">{fmtMoney(c.revenue)}</span>
                </li>
              ))}
            </ul>
          )}

          <Link to="/geography" className="btn-primary mt-7">
            Open the globe <ArrowRight size={15} />
          </Link>
        </div>

        <div className="glass overflow-hidden rounded-3xl p-2">
          <Suspense fallback={<div className="shimmer h-[420px] rounded-2xl md:h-[520px]" />}>
            <Globe points={points} height={520} className="h-[420px] md:h-[520px]" />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
