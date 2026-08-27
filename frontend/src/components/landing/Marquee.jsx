const ITEMS = [
  'Revenue intelligence', 'Cohort retention', 'RFM segments', '3D order globe', 'Forecasting', 'Live feed', 'Inventory alerts', '⌘K palette',
];

/** Infinite capability strip — pure CSS keyframes, pauses on hover. */
export default function Marquee() {
  const copy = (key) => (
    <ul className="flex shrink-0 items-center" aria-hidden={key === 'b' ? 'true' : undefined} key={key}>
      {ITEMS.map((item, i) => (
        <li key={`${key}-${i}`} className="flex items-center">
          <span className="whitespace-nowrap px-6 font-display text-sm font-semibold uppercase tracking-[0.18em] text-fg-2 md:text-base">{item}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-teal" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <section className="nc-marquee relative border-y border-line/10 bg-line/[0.03] py-4" aria-label="Capabilities">
      <div className="nc-marquee-track">
        {copy('a')}
        {copy('b')}
      </div>
    </section>
  );
}
