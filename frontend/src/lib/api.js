import axios from 'axios';

// In dev the Vite proxy forwards /api → Express. In production the API serves the SPA from the same origin.
// VITE_BACKEND_URL can still override (e.g. split hosting).
const baseURL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export const http = axios.create({ baseURL, timeout: 20_000 });

http.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body && body.success === false) throw new Error(body.message || 'Request failed');
    return body?.data !== undefined ? body.data : body;
  },
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  },
);

const get = (url, params) => http.get(url, { params });

export const api = {
  health: () => get('/api/health'),
  meta: () => get('/api/meta'),
  summary: (range) => get('/api/summary', { range }),
  insights: (range) => get('/api/insights', { range }),
  sales: {
    timeseries: (interval, range) => get('/api/sales/timeseries', { interval, range }),
    growth: (interval) => get('/api/sales/growth', { interval }),
    heatmap: (range) => get('/api/sales/heatmap', { range }),
    forecast: (months = 6) => get('/api/sales/forecast', { months }),
    channels: (range) => get('/api/sales/channels', { range }),
    categories: (range) => get('/api/sales/categories', { range }),
  },
  orders: {
    list: (params) => get('/api/orders', params),
    recent: (limit = 12) => get('/api/orders/recent', { limit }),
    status: (range) => get('/api/orders/status', { range }),
    detail: (id) => get(`/api/orders/${id}`),
  },
  products: {
    list: (params) => get('/api/products', params),
    top: (params) => get('/api/products/top', params),
    inventory: () => get('/api/products/inventory'),
  },
  customers: {
    list: (params) => get('/api/customers', params),
    top: (limit = 10) => get('/api/customers/top', { limit }),
    new: (interval, range) => get('/api/customers/new', { interval, range }),
    repeat: (interval, range) => get('/api/customers/repeat', { interval, range }),
    cohorts: (months = 12) => get('/api/customers/cohorts', { months }),
    geo: () => get('/api/customers/geo'),
    rfm: () => get('/api/customers/rfm'),
  },
};
