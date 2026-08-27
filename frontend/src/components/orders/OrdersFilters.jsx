import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { PAGE_SIZES, SORT_OPTIONS, STATUS_OPTIONS } from './constants.js';

/** Native select dressed as `.input` (keeps keyboard/mobile behaviour). Exported for ProductFilters. */
export function Select({ value, onChange, options, label, className = '' }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input appearance-none pr-8" aria-label={label}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3" />
    </label>
  );
}

/** Search box with a 300ms debounce. Syncs from `value` only when the change did not originate here. */
export function DebouncedSearch({ value, onChange, placeholder = 'Search…', delay = 300, className = '' }) {
  const [q, setQ] = useState(value ?? '');
  const emitted = useRef(value ?? '');

  useEffect(() => {
    if ((value ?? '') !== emitted.current) { setQ(value ?? ''); emitted.current = value ?? ''; }
  }, [value]);

  useEffect(() => {
    if (q === emitted.current) return undefined;
    const t = setTimeout(() => { emitted.current = q; onChange(q); }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="input !pl-9 !pr-8" aria-label={placeholder} />
      {q && (
        <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-3 hover:bg-line/10 hover:text-fg">
          <X size={13} />
        </button>
      )}
    </div>
  );
}

export default function OrdersFilters({ search, status, sort, limit, onChange }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <DebouncedSearch value={search} onChange={(v) => onChange({ search: v })} placeholder="Search order #, customer, city…" className="md:flex-1" />
      <div className="grid gap-2 sm:grid-cols-3 md:flex">
        <Select label="Status" value={status ?? ''} onChange={(v) => onChange({ status: v })} options={STATUS_OPTIONS} />
        <Select label="Sort" value={sort} onChange={(v) => onChange({ sort: v })} options={SORT_OPTIONS} />
        <Select label="Rows per page" value={String(limit)} onChange={(v) => onChange({ limit: Number(v) })} options={PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} rows` }))} />
      </div>
    </div>
  );
}
