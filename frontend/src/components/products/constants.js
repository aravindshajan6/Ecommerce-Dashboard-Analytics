/** Shared, non-component exports for the products widgets. */
export const STOCK_OPTIONS = [
  { value: '', label: 'All stock levels' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];
export const SORT_OPTIONS = [
  { value: 'revenue:desc', label: 'Top revenue' },
  { value: 'units:desc', label: 'Most units' },
  { value: 'orders:desc', label: 'Most orders' },
  { value: 'price:desc', label: 'Price: high → low' },
  { value: 'price:asc', label: 'Price: low → high' },
  { value: 'stock:asc', label: 'Lowest stock' },
  { value: 'title:asc', label: 'Name A → Z' },
];
