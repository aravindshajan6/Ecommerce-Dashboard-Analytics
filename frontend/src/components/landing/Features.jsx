import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Activity, ArrowUpRight, Globe2, LayoutGrid, Package, Target, TrendingUp } from 'lucide-react';
import Sparkline from '../ui/Sparkline.jsx';
import Reveal from './Reveal.jsx';

/* ---------- tiny decorative visuals ---------- */
function VisualSpark() {
  return (
    <div className="flex items-end justify-between gap-3">
      <Sparkline data={[12, 18, 15, 22, 26, 24, 31, 29, 36, 42, 39, 48]} width={170} height={56} color="rgb(var(--primary))" />
      <div className="text-right">
        <p className="font-display text-lg font-semibold leading-none text-fg">+18.4%</p>
        <p className="mt-1 text-[10px] text-fg-3">vs previous</p>
      </div>
    </div>
  );
}

function VisualHeatmap() {
  const rows = 5, cols = 8;
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-hidden="true">
      {Array.from({ length: rows * cols }).map((_, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const o = Math.max(0.08, 1 - c * 0.13 - r * 0.05);
        return <span key={i} className="nc-breathe aspect-square rounded-[4px] bg-teal" style={{ '--o': o, '--d': `${(i % 7) * 0.3}s`, opacity: o }} />;
      })}
    </div>
  );
}

function VisualSegments() {
  const segs = [
    { l: 'Champions', w: 34, c: 'bg-primary' }, { l: 'Loyal', w: 26, c: 'bg-teal' }, { l: 'At risk', w: 22, c: 'bg-warning' }, { l: 'Lost', w: 18, c: 'bg-pink' },
  ];
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {segs.map((s) => <span key={s.l} className={clsx('h-full', s.c)} style={{ width: `${s.w}%` }} />)}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {segs.map((s) => (
          <span key={s.l} className="inline-flex items-center gap-1 text-[10px] text-fg-3"><span className={clsx('h-1.5 w-1.5 rounded-full', s.c)} />{s.l}</span>
        ))}
      </div>
    </div>
  );
}

function VisualGlobe() {
  return (
    <div className="relative mx-auto h-[92px] w-[92px]" aria-hidden="true">
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgb(var(--teal)/0.55),rgb(var(--primary)/0.45)_45%,rgb(var(--violet)/0.25)_70%,transparent_72%)] shadow-[0_0_40px_-8px_rgb(var(--primary)/0.7)]" />
      <span className="nc-orbit absolute inset-[-8px] rounded-full border border-dashed border-teal/50" />
      <span className="nc-orbit-rev absolute inset-[6px] rounded-full border border-primary/40 [transform:rotateX(60deg)]" />
      {[[18, 30], [60, 22], [70, 62], [30, 66]].map(([x, y], i) => (
        <span key={i} className="absolute h-1.5 w-1.5 rounded-full bg-pink shadow-[0_0_8px_rgb(var(--pink))]" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </div>
  );
}

function VisualFeed() {
  const rows = [['#1042', 'Mumbai', '₹2,480'], ['#1041', 'Bengaluru', '₹1,120'], ['#1040', 'Delhi', '₹6,340']];
  return (
    <div className="flex flex-col gap-1.5" aria-hidden="true">
      {rows.map(([id, city, amt], i) => (
        <div key={id} className={clsx('relative flex items-center gap-2 overflow-hidden rounded-lg bg-line/5 px-2 py-1 text-[11px]', i === 0 && 'nc-scan')}>
          {i === 0 ? <span className="live-dot" /> : <span className="h-2 w-2 rounded-full bg-line/20" />}
          <span className="font-mono text-fg-2">{id}</span>
          <span className="text-fg-3">{city}</span>
          <span className="ml-auto tabular font-medium text-fg">{amt}</span>
        </div>
      ))}
    </div>
  );
}

function VisualInventory() {
  const bars = [{ w: 92, c: 'bg-success' }, { w: 70, c: 'bg-success' }, { w: 38, c: 'bg-warning' }, { w: 12, c: 'bg-danger' }];
  return (
    <div className="flex flex-col gap-1.5" aria-hidden="true">
      {bars.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-line/10"><span className={clsx('block h-full rounded-full', b.c)} style={{ width: `${b.w}%` }} /></span>
          <span className="w-8 text-right text-[10px] tabular text-fg-3">{b.w}%</span>
        </div>
      ))}
      <p className="mt-0.5 text-[10px] text-warning">2 SKUs run out in &lt; 9 days</p>
    </div>
  );
}

const FEATURES = [
  { to: '/sales', icon: TrendingUp, title: 'Revenue intelligence', copy: 'Timeseries, growth, channels and a Holt-trend forecast in one view.', chip: 'from-primary to-violet', span: 'lg:col-span-5', Visual: VisualSpark },
  { to: '/customers', icon: LayoutGrid, title: 'Cohort retention', copy: 'Month-of-first-purchase cohorts with retention curves and LTV.', chip: 'from-teal to-primary', span: 'lg:col-span-4', Visual: VisualHeatmap },
  { to: '/customers', icon: Target, title: 'RFM segments', copy: 'Champions to Lost — ten segments scored on recency, frequency, monetary.', chip: 'from-pink to-violet', span: 'lg:col-span-3', Visual: VisualSegments },
  { to: '/geography', icon: Globe2, title: '3D order globe', copy: 'Every city lights up on an interactive globe and a Leaflet map.', chip: 'from-teal to-pink', span: 'lg:col-span-3', Visual: VisualGlobe },
  { to: '/orders', icon: Activity, title: 'Live order feed', copy: 'Latest orders stream in with a status funnel from placed to delivered.', chip: 'from-primary to-teal', span: 'lg:col-span-4', Visual: VisualFeed },
  { to: '/products', icon: Package, title: 'Inventory alerts', copy: 'Velocity-aware days-left estimates flag stockouts before they happen.', chip: 'from-warning to-pink', span: 'lg:col-span-5', Visual: VisualInventory },
];

function FeatureCard({ to, icon: Icon, title, copy, chip, span, Visual }) {
  const onMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);
  return (
    <Link
      to={to}
      onPointerMove={onMove}
      className={clsx('glass spot group flex min-h-[240px] flex-col p-5 transition-transform hover:-translate-y-0.5 md:col-span-6', span)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg', chip)}>
          <Icon size={18} />
        </span>
        <ArrowUpRight size={16} className="text-fg-3 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-fg">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-fg-2">{copy}</p>
      <div className="mt-auto pt-5"><Visual /></div>
    </Link>
  );
}

export default function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-[1400px] scroll-mt-24 px-4 py-20 md:px-6 md:py-28">
      <Reveal className="mb-10 max-w-2xl" each={100}>
        <p className="eyebrow !text-teal">Features</p>
        <h2 className="mt-2 text-3xl font-semibold text-fg md:text-[40px] md:leading-[1.1]">Everything your store is trying to tell you.</h2>
        <p className="mt-3 text-base text-fg-2">Six views, one dataset. Each tile below is a live page in the dashboard.</p>
      </Reveal>
      <Reveal className="grid grid-cols-1 gap-4 md:grid-cols-12" each={90} y={28}>
        {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
      </Reveal>
    </section>
  );
}
