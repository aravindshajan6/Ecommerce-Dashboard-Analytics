import { Bell, Menu, Moon, Search, Sun, CalendarRange } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../lib/theme.jsx';
import { RANGES, useRange } from '../../lib/range.jsx';
import { NAV } from './Sidebar.jsx';
import { useInsights } from '../../hooks/useApi.js';

export default function Topbar({ onMenu, onOpenPalette }) {
  const { theme, toggle } = useTheme();
  const { range, setRange } = useRange();
  const { pathname } = useLocation();
  const current = NAV.find((n) => pathname.startsWith(n.to));
  const { data: insights } = useInsights();
  const alerts = insights?.filter((i) => i.type === 'alert' || i.type === 'negative').length ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/10 bg-bg/60 px-4 backdrop-blur-xl md:px-6">
      <button className="btn-ghost !p-2 lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu size={18} /></button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-fg-3">{current?.hint ?? 'Analytics'}</p>
        <h2 className="truncate font-display text-base font-semibold leading-tight text-fg">{current?.label ?? 'Nova Commerce'}</h2>
      </div>

      <button onClick={onOpenPalette} className="btn-ghost hidden md:inline-flex !py-1.5 text-fg-3" aria-label="Open command palette">
        <Search size={14} />
        <span className="text-xs">Search or jump to…</span>
        <kbd className="ml-2 rounded-md border border-line/15 bg-line/5 px-1.5 py-0.5 font-mono text-[10px] text-fg-3">⌘K</kbd>
      </button>

      <label className="relative inline-flex items-center">
        <CalendarRange size={14} className="pointer-events-none absolute left-2.5 text-fg-3" />
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="input !w-auto appearance-none !py-1.5 !pl-8 !pr-7 text-xs font-medium"
          aria-label="Date range"
        >
          {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </label>

      <button className="btn-ghost relative !p-2" aria-label={`${alerts} alerts`} onClick={onOpenPalette}>
        <Bell size={16} />
        {alerts > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-pink px-1 text-[9px] font-bold text-white">{alerts}</span>}
      </button>
      <button className="btn-ghost !p-2" onClick={toggle} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  );
}
