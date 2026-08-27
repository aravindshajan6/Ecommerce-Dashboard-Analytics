import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import InsightsPanel from '../insights/InsightsPanel.jsx';
import Reveal from './Reveal.jsx';

const DataCore = lazy(() => import('../three/DataCore.jsx'));

const RULES = ['Revenue vs previous period', 'Product momentum', 'Biggest city', 'Stockouts', 'Unusual days (z > 2)', 'AOV shift', 'Repeat-rate change'];

export default function LiveInsights() {
  return (
    <section id="demo" className="mx-auto w-full max-w-[1400px] scroll-mt-24 px-4 py-12 md:px-6 md:py-20">
      <Reveal className="glass overflow-hidden p-5 md:p-8" each={120} y={20}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-8">
            <p className="eyebrow !text-pink">Live insights</p>
            <h2 className="mt-2 text-3xl font-semibold text-fg md:text-[40px] md:leading-[1.1]">Your store, narrated.</h2>
            <p className="mt-3 max-w-xl text-base text-fg-2">
              Insights are generated automatically from the data — no prompts, no templates. Each one links to the page where you can dig in.
            </p>
            <div className="mt-6">
              <InsightsPanel limit={4} />
            </div>
          </div>
          <aside className="order-1 flex flex-col items-center justify-center gap-4 text-center lg:order-2 lg:col-span-4">
            <div className="nc-float">
              <Suspense fallback={<div className="shimmer rounded-full" style={{ width: 140, height: 140 }} />}>
                <DataCore size={140} />
              </Suspense>
            </div>
            <p className="text-sm font-medium text-fg">Insight engine</p>
            <ul className="flex flex-wrap justify-center gap-1.5">
              {RULES.map((r) => <li key={r} className="pill bg-line/5 text-fg-3">{r}</li>)}
            </ul>
            <Link to="/overview" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              See all insights <ArrowRight size={14} />
            </Link>
          </aside>
        </div>
      </Reveal>
    </section>
  );
}
