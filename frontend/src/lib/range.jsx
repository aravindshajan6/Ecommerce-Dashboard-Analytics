import { createContext, useContext, useMemo, useState } from 'react';

export const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All time' },
];

export const INTERVALS = [
  { value: 'daily', label: 'Day' },
  { value: 'weekly', label: 'Week' },
  { value: 'monthly', label: 'Month' },
  { value: 'quarterly', label: 'Quarter' },
  { value: 'yearly', label: 'Year' },
];

const RangeContext = createContext({ range: '12m', setRange: () => {} });

export function RangeProvider({ children }) {
  const [range, setRange] = useState(() => {
    try { return localStorage.getItem('nova:range') || '12m'; } catch { return '12m'; }
  });
  const value = useMemo(
    () => ({
      range,
      setRange: (r) => { setRange(r); try { localStorage.setItem('nova:range', r); } catch { /* ignore */ } },
      rangeLabel: RANGES.find((x) => x.value === range)?.label ?? range,
    }),
    [range],
  );
  return <RangeContext.Provider value={value}>{children}</RangeContext.Provider>;
}

export const useRange = () => useContext(RangeContext);
