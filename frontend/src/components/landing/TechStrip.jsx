import Reveal from './Reveal.jsx';

const TECH = [
  { name: 'React 19', dot: 'bg-teal' },
  { name: 'Three.js / R3F', dot: 'bg-primary' },
  { name: 'anime.js v4', dot: 'bg-pink' },
  { name: 'Recharts', dot: 'bg-violet' },
  { name: 'TanStack Query', dot: 'bg-warning' },
  { name: 'Express', dot: 'bg-fg-2' },
  { name: 'MongoDB', dot: 'bg-success' },
];

export default function TechStrip() {
  return (
    <section id="tech" className="mx-auto w-full max-w-[1400px] px-4 py-10 md:px-6 md:py-14">
      <Reveal className="flex flex-col items-center gap-5 text-center" each={60} y={12}>
        <p className="eyebrow">Under the hood</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {TECH.map((t) => (
            <li key={t.name} className="glass inline-flex items-center gap-2 !rounded-full px-3.5 py-1.5 text-sm font-medium text-fg-2">
              <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} aria-hidden="true" />
              {t.name}
            </li>
          ))}
        </ul>
        <p className="max-w-lg text-xs text-fg-3">Vite 6 build · Tailwind 3.4 tokens · WebGL scenes pause off-screen and fall back to gradients under reduced motion.</p>
      </Reveal>
    </section>
  );
}
