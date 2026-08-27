import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useRange } from '../lib/range.jsx';

/** Thin useQuery wrappers so pages stay declarative. All return TanStack query results. */
export const useHealth = () => useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 30_000 });
export const useMeta = () => useQuery({ queryKey: ['meta'], queryFn: api.meta });

export function useSummary() {
  const { range } = useRange();
  return useQuery({ queryKey: ['summary', range], queryFn: () => api.summary(range) });
}
export function useInsights() {
  const { range } = useRange();
  return useQuery({ queryKey: ['insights', range], queryFn: () => api.insights(range) });
}

export function useSalesTimeseries(interval) {
  const { range } = useRange();
  return useQuery({ queryKey: ['sales', 'timeseries', interval, range], queryFn: () => api.sales.timeseries(interval, range) });
}
export const useSalesGrowth = (interval = 'monthly') =>
  useQuery({ queryKey: ['sales', 'growth', interval], queryFn: () => api.sales.growth(interval) });
export function useSalesHeatmap() {
  const { range } = useRange();
  return useQuery({ queryKey: ['sales', 'heatmap', range], queryFn: () => api.sales.heatmap(range) });
}
export const useSalesForecast = (months = 6) =>
  useQuery({ queryKey: ['sales', 'forecast', months], queryFn: () => api.sales.forecast(months) });
export function useSalesChannels() {
  const { range } = useRange();
  return useQuery({ queryKey: ['sales', 'channels', range], queryFn: () => api.sales.channels(range) });
}
export function useSalesCategories() {
  const { range } = useRange();
  return useQuery({ queryKey: ['sales', 'categories', range], queryFn: () => api.sales.categories(range) });
}

export function useOrders(params) {
  const { range } = useRange();
  const p = { range, ...params };
  return useQuery({ queryKey: ['orders', 'list', p], queryFn: () => api.orders.list(p), placeholderData: (prev) => prev });
}
export const useRecentOrders = (limit = 12, refetchInterval = 15_000) =>
  useQuery({ queryKey: ['orders', 'recent', limit], queryFn: () => api.orders.recent(limit), refetchInterval });
export function useOrderStatus() {
  const { range } = useRange();
  return useQuery({ queryKey: ['orders', 'status', range], queryFn: () => api.orders.status(range) });
}
export const useOrder = (id) =>
  useQuery({ queryKey: ['orders', 'detail', id], queryFn: () => api.orders.detail(id), enabled: !!id });

export function useProducts(params) {
  const { range } = useRange();
  const p = { range, ...params };
  return useQuery({ queryKey: ['products', 'list', p], queryFn: () => api.products.list(p), placeholderData: (prev) => prev });
}
export function useTopProducts(params = {}) {
  const { range } = useRange();
  const p = { range, limit: 10, by: 'revenue', ...params };
  return useQuery({ queryKey: ['products', 'top', p], queryFn: () => api.products.top(p) });
}
export const useInventory = () => useQuery({ queryKey: ['products', 'inventory'], queryFn: api.products.inventory });

export const useCustomers = (params) =>
  useQuery({ queryKey: ['customers', 'list', params], queryFn: () => api.customers.list(params), placeholderData: (prev) => prev });
export const useTopCustomers = (limit = 10) =>
  useQuery({ queryKey: ['customers', 'top', limit], queryFn: () => api.customers.top(limit) });
export function useNewCustomers(interval) {
  const { range } = useRange();
  return useQuery({ queryKey: ['customers', 'new', interval, range], queryFn: () => api.customers.new(interval, range) });
}
export function useRepeatCustomers(interval) {
  const { range } = useRange();
  return useQuery({ queryKey: ['customers', 'repeat', interval, range], queryFn: () => api.customers.repeat(interval, range) });
}
export const useCohorts = (months = 12) =>
  useQuery({ queryKey: ['customers', 'cohorts', months], queryFn: () => api.customers.cohorts(months) });
export const useGeo = () => useQuery({ queryKey: ['customers', 'geo'], queryFn: api.customers.geo, staleTime: 5 * 60_000 });
export const useRfm = () => useQuery({ queryKey: ['customers', 'rfm'], queryFn: api.customers.rfm });
