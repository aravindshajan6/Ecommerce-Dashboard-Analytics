import { DebouncedSearch, Select } from '../orders/OrdersFilters.jsx';
import { SORT_OPTIONS, STOCK_OPTIONS } from './constants.js';

/** `categories` = names from /api/sales/categories. Category + stock filters are applied client-side by the page. */
export default function ProductFilters({ search, category, status, sort, categories = [], onChange }) {
  const catOptions = [{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))];
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <DebouncedSearch value={search} onChange={(v) => onChange({ search: v })} placeholder="Search products, vendors…" className="md:flex-1" />
      <div className="grid gap-2 sm:grid-cols-3 md:flex">
        <Select label="Category" value={category ?? ''} onChange={(v) => onChange({ category: v })} options={catOptions} />
        <Select label="Stock status" value={status ?? ''} onChange={(v) => onChange({ status: v })} options={STOCK_OPTIONS} />
        <Select label="Sort" value={sort} onChange={(v) => onChange({ sort: v })} options={SORT_OPTIONS} />
      </div>
    </div>
  );
}
