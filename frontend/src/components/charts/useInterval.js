import { useState } from 'react';
import { useRange } from '../../lib/range.jsx';
import { defaultInterval } from './series.js';

/** Interval state that follows the global range (7d/30d→daily, 90d→weekly, else monthly) until the user overrides it. */
export function useIntervalForRange() {
  const { range } = useRange();
  const [sel, setSel] = useState({ range, interval: defaultInterval(range) });
  const interval = sel.range === range ? sel.interval : defaultInterval(range);
  return [interval, (next) => setSel({ range, interval: next })];
}
