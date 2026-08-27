import { NavLink, Link } from 'react-router-dom';
import clsx from 'clsx';
import { LayoutDashboard, TrendingUp, ShoppingBag, Package, Users, Globe2, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react';
import { useHealth } from '../../hooks/useApi.js';
import Logo from './Logo.jsx';

export const NAV = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard, hint: 'KPIs, insights, live feed' },
  { to: '/sales', label: 'Sales', icon: TrendingUp, hint: 'Revenue, growth, forecast' },
  { to: '/orders', label: 'Orders', icon: ShoppingBag, hint: 'Orders, status funnel' },
  { to: '/products', label: 'Products', icon: Package, hint: 'Catalog, inventory' },
  { to: '/customers', label: 'Customers', icon: Users, hint: 'Cohorts, RFM, retention' },
  { to: '/geography', label: 'Geography', icon: Globe2, hint: '3D globe, city map' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  const { data: health } = useHealth();
  return (
    <>
      {/* mobile backdrop */}
      <div className={clsx('fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity', mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={onClose} />
      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-line/10 bg-panel/80 backdrop-blur-xl transition-[width,transform] duration-300',
          collapsed ? 'w-[72px]' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Primary"
      >
        <Link to="/" className={clsx('flex h-16 items-center gap-3 px-4', collapsed && 'justify-center px-0')} onClick={onClose}>
          <Logo size={30} />
          {!collapsed && (
            <span className="font-display text-base font-semibold tracking-tight text-fg">
              Nova<span className="text-gradient">Commerce</span>
            </span>
          )}
        </Link>

        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ to, label, icon: Icon, hint }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-0',
                  isActive ? 'bg-primary/15 text-fg shadow-[inset_0_0_0_1px_rgb(var(--primary)/0.35)]' : 'text-fg-2 hover:bg-line/5 hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />}
                  <Icon size={18} className={clsx('shrink-0 transition-transform group-hover:scale-110', isActive && 'text-primary')} />
                  {!collapsed && (
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span>{label}</span>
                      <span className="truncate text-[10px] font-normal text-fg-3">{hint}</span>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={clsx('m-3 rounded-2xl border border-line/10 bg-line/5 p-3', collapsed && 'p-2')}>
          {collapsed ? (
            <span className="mx-auto block h-2 w-2 rounded-full bg-teal" title={`Data source: ${health?.source ?? '…'}`} />
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs">
                <span className="live-dot" />
                <span className="font-medium text-fg">{health ? (health.source === 'mongodb' ? 'MongoDB live' : 'Demo dataset') : 'Connecting…'}</span>
              </div>
              <p className="mt-1 text-[11px] text-fg-3">
                {health ? `${(health.ordersLoaded ?? 0).toLocaleString()} orders indexed` : 'Waiting for API'}
              </p>
              <Link to="/" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                <Sparkles size={11} /> Landing page
              </Link>
            </>
          )}
        </div>

        <button onClick={onToggle} className="mb-3 hidden self-center rounded-lg p-1.5 text-fg-3 hover:bg-line/5 hover:text-fg lg:block" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </aside>
    </>
  );
}
