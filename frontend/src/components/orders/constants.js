/** Shared, non-component exports for the orders widgets (kept out of .jsx files so Fast Refresh stays happy). */
export const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'voided', label: 'Voided' },
];
export const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'total:desc', label: 'Highest total' },
  { value: 'total:asc', label: 'Lowest total' },
  { value: 'itemCount:desc', label: 'Most items' },
];
export const PAGE_SIZES = [10, 20, 50];

export const orderNo = (n) => `#${String(n ?? '').replace(/^#/, '')}`;

/** Flip direction when the same field is clicked, otherwise start descending. */
export function nextSort(current, field) {
  const [f, d] = (current || '').split(':');
  return f === field && d === 'desc' ? `${field}:asc` : `${field}:desc`;
}
