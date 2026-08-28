import { Suspense, lazy, useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import { useMeta } from './hooks/useApi.js';
import { setCurrency } from './lib/format.js';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Overview = lazy(() => import('./pages/Overview.jsx'));
const Sales = lazy(() => import('./pages/Sales.jsx'));
const Orders = lazy(() => import('./pages/Orders.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const Customers = lazy(() => import('./pages/Customers.jsx'));
const Geography = lazy(() => import('./pages/Geography.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function PageFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex items-center gap-3 text-sm text-fg-3">
        <span className="h-2 w-2 animate-ping rounded-full bg-primary" /> Loading…
      </div>
    </div>
  );
}

/**
 * Resets scroll when moving between sections. Keyed on the first path segment, not the whole
 * pathname, so opening the order drawer (/orders → /orders/:id) keeps your place in the table.
 * Back/forward (POP) is left alone so the browser can restore position naturally.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const section = pathname.split('/')[1] ?? '';
  const prev = useRef(section);

  useEffect(() => {
    if (navType !== 'POP' && prev.current !== section) window.scrollTo(0, 0);
    prev.current = section;
  }, [section, navType]);

  return null;
}

export default function App() {
  const { data: meta } = useMeta();
  if (meta?.currency) setCurrency(meta.currency);

  return (
    <Suspense fallback={<PageFallback />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppShell />}>
          <Route path="/overview" element={<Overview />} />
          <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<Orders />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/geography" element={<Geography />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
