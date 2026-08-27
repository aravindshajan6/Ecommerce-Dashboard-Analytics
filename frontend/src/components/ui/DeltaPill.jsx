import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { fmtPct } from '../../lib/format.js';

/** Shows +x.x% / −x.x% with color. `invert` when a decrease is good (e.g. refund rate). */
export default function DeltaPill({ value, invert = false, suffix = 'vs prev', className }) {
  if (value == null || Number.isNaN(value)) return <span className={clsx('pill bg-line/10 text-fg-3', className)}><Minus size={11} /> n/a</span>;
  const up = value > 0.05, down = value < -0.05;
  const good = invert ? down : up;
  const bad = invert ? up : down;
  return (
    <span
      className={clsx('pill', good && 'bg-success/15 text-success', bad && 'bg-danger/15 text-danger', !good && !bad && 'bg-line/10 text-fg-2', className)}
      title={`${fmtPct(value, { sign: true })} ${suffix}`}
    >
      {up ? <ArrowUpRight size={11} /> : down ? <ArrowDownRight size={11} /> : <Minus size={11} />}
      {fmtPct(Math.abs(value))}
    </span>
  );
}
