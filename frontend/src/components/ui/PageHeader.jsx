import { useReveal } from '../../hooks/useAnime.js';

export default function PageHeader({ eyebrow, title, description, actions }) {
  const ref = useReveal(true, { each: 80, y: 12 });
  return (
    <div ref={ref} className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-2xl md:text-3xl font-semibold text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-fg-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
