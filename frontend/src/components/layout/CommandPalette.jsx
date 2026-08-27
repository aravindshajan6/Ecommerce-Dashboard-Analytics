import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { animate, utils } from 'animejs';
import clsx from 'clsx';
import {
  AlertTriangle, ArrowDown, ArrowUp, CalendarRange, Check, Clock, CornerDownLeft, Download, Moon, RefreshCw, Search, Sparkles, Sun, TrendingDown,
} from 'lucide-react';
import { NAV } from './Sidebar.jsx';
import { RANGES, useRange } from '../../lib/range.jsx';
import { useTheme } from '../../lib/theme.jsx';
import { useInsights } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { prefersReducedMotion } from '../../lib/motion.js';

const RECENT_KEY = 'nova:recent-commands';
const GROUP_ORDER = ['Recent', 'Alerts', 'Navigate', 'Date range', 'Theme', 'Actions'];

function readRecent() {
  try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
function writeRecent(ids) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 3))); } catch { /* ignore */ }
}

function toCsv(rows) {
  if (!rows?.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}
function downloadText(name, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Matches when every whitespace-separated token of the query appears in the haystack. */
function matches(item, q) {
  if (!q) return true;
  const hay = `${item.label} ${item.keywords || ''} ${item.group} ${item.hint || ''}`.toLowerCase();
  return q.split(/\s+/).filter(Boolean).every((tok) => hay.includes(tok));
}

/**
 * ⌘K command palette. Props: { open, onClose }
 * Groups: Recent (from localStorage), Alerts (live insights), Navigate, Date range, Theme, Actions.
 */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { range, setRange } = useRange();
  const { theme, toggle } = useTheme();
  const { data: insights } = useInsights();

  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState(readRecent);
  const [status, setStatus] = useState(null); // { tone: 'info'|'error', text }
  const [busy, setBusy] = useState(false);

  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const animsRef = useRef([]);

  // ---------- commands ----------
  const commands = useMemo(() => {
    const list = [];
    [...NAV, { to: '/', label: 'Landing', icon: Sparkles, hint: 'Public landing page' }].forEach(({ to, label, icon, hint }) => {
      list.push({ id: `nav:${to}`, group: 'Navigate', label, hint, icon, keywords: `go open page ${to}`, run: () => navigate(to) });
    });
    RANGES.forEach((r) => {
      list.push({
        id: `range:${r.value}`, group: 'Date range', label: r.label, icon: CalendarRange,
        hint: r.value === range ? 'Current' : undefined, current: r.value === range,
        keywords: `date range period ${r.value} set`, run: () => setRange(r.value),
      });
    });
    list.push({
      id: 'theme:toggle', group: 'Theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
      icon: theme === 'dark' ? Sun : Moon, keywords: 'theme toggle dark light mode appearance', run: () => toggle(),
    });
    list.push({
      id: 'action:refresh', group: 'Actions', label: 'Refresh data', hint: 'Re-fetch every widget', icon: RefreshCw,
      keywords: 'reload refetch invalidate sync', run: () => queryClient.invalidateQueries(),
    });
    list.push({
      id: 'action:export-csv', group: 'Actions', label: 'Export revenue CSV', hint: `Monthly · ${RANGES.find((r) => r.value === range)?.label ?? range}`, icon: Download,
      keywords: 'download csv export sales revenue timeseries', keepOpen: true,
      run: async () => {
        const rows = await api.sales.timeseries('monthly', range);
        const csv = toCsv((rows || []).map(({ period, label, revenue, orders, units, aov, newCustomers }) => ({ period, label, revenue, orders, units, aov, newCustomers })));
        if (!csv) throw new Error('No rows to export');
        downloadText(`nova-revenue-monthly-${range}.csv`, csv);
        return `Exported ${rows.length} rows`;
      },
    });
    (insights || []).filter((i) => i.type === 'alert' || i.type === 'negative').forEach((i) => {
      list.push({
        id: `alert:${i.id}`, group: 'Alerts', label: i.title, hint: i.body, icon: i.type === 'alert' ? AlertTriangle : TrendingDown, tone: i.type,
        keywords: `alert insight ${i.metric || ''} ${i.type}`, run: () => { if (i.href) navigate(i.href); },
      });
    });
    return list;
  }, [navigate, range, setRange, theme, toggle, queryClient, insights]);

  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const byGroup = new Map();
    if (!q && recent.length) {
      const items = recent.map((id) => commands.find((c) => c.id === id)).filter(Boolean);
      if (items.length) byGroup.set('Recent', items.map((c) => ({ ...c, group: 'Recent', recentOf: c.group })));
    }
    commands.filter((c) => matches(c, q)).forEach((c) => {
      if (!byGroup.has(c.group)) byGroup.set(c.group, []);
      byGroup.get(c.group).push(c);
    });
    return GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({ name: g, items: byGroup.get(g) }));
  }, [commands, q, recent]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // ---------- open / close choreography ----------
  useEffect(() => {
    if (open) {
      setVisible(true);
      setQuery('');
      setActive(0);
      setStatus(null);
      setRecent(readRecent());
    }
  }, [open]);

  useEffect(() => {
    if (!visible) return undefined;
    const backdrop = backdropRef.current, panel = panelRef.current;
    if (!backdrop || !panel) return undefined;
    const reduced = prefersReducedMotion();
    // utils.remove() (not pause()) — a paused anime.js v4 animation still owns the tweened
    // properties, so the close animation would composite against the in-flight open one and
    // take far longer than its 180ms. Removing cancels them outright.
    utils.remove(backdrop);
    utils.remove(panel);
    animsRef.current = [];
    if (open) {
      if (reduced) { backdrop.style.opacity = 1; panel.style.opacity = 1; panel.style.transform = 'none'; }
      else {
        animsRef.current.push(
          animate(backdrop, { opacity: [0, 1], duration: 220, ease: 'outQuad' }),
          animate(panel, { opacity: [0, 1], scale: [0.96, 1], translateY: [10, 0], duration: 320, ease: 'outExpo' }),
        );
      }
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
    // closing
    if (reduced) { setVisible(false); return undefined; }
    animsRef.current.push(
      animate(backdrop, { opacity: 0, duration: 180, ease: 'outQuad' }),
      animate(panel, { opacity: 0, scale: 0.97, translateY: 6, duration: 180, ease: 'outQuad', onComplete: () => setVisible(false) }),
    );
    return undefined;
  }, [open, visible]);

  useEffect(() => () => {
    const b = backdropRef.current, p = panelRef.current;
    if (b) utils.remove(b);
    if (p) utils.remove(p);
    animsRef.current = [];
  }, []);

  // Lock body scroll while visible.
  useEffect(() => {
    if (!visible) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  // Keep active row in view + clamp.
  useEffect(() => { setActive((a) => Math.min(a, Math.max(0, flat.length - 1))); }, [flat.length]);
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  // ---------- execution ----------
  const execute = useCallback(async (item) => {
    if (!item || busy) return;
    const next = [item.id, ...recent.filter((id) => id !== item.id)].slice(0, 3);
    writeRecent(next);
    setRecent(next);
    try {
      if (item.keepOpen) {
        setBusy(true);
        setStatus({ tone: 'info', text: 'Working…' });
        const msg = await item.run();
        setStatus({ tone: 'info', text: msg || 'Done' });
        setBusy(false);
        setTimeout(() => onClose?.(), 600);
      } else {
        item.run();
        onClose?.();
      }
    } catch (err) {
      setBusy(false);
      setStatus({ tone: 'error', text: err?.message || 'Something went wrong' });
    }
  }, [busy, recent, onClose]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (flat.length ? (a + 1) % flat.length : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(Math.max(0, flat.length - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); execute(flat[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose?.(); }
    else if (e.key === 'Tab') {
      // Basic focus trap: cycle focusables inside the panel.
      const f = Array.from(panelRef.current?.querySelectorAll('input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') || []);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      const nextEl = e.shiftKey ? f[(i - 1 + f.length) % f.length] : f[(i + 1) % f.length];
      nextEl?.focus();
    }
  };

  if (!visible) return null;

  let runningIndex = -1;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onKeyDown={onKeyDown}
    >
      <div ref={backdropRef} className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ opacity: 0 }} onMouseDown={() => onClose?.()} aria-hidden="true" />
      <div
        ref={panelRef}
        className="glass relative flex w-full max-w-xl flex-col overflow-hidden !rounded-2xl shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]"
        style={{ opacity: 0, backgroundColor: 'rgb(var(--panel) / 0.92)' }}
      >
        <div className="flex items-center gap-3 border-b border-line/10 px-4">
          <Search size={16} className="shrink-0 text-fg-3" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            placeholder="Type a command or search…"
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-3"
            aria-label="Search commands"
            aria-activedescendant={flat[active] ? `cmd-${flat[active].id}` : undefined}
            aria-controls="cmd-list"
            role="combobox"
            aria-expanded="true"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden rounded-md border border-line/15 bg-line/5 px-1.5 py-0.5 font-mono text-[10px] text-fg-3 sm:block">esc</kbd>
        </div>

        <div ref={listRef} id="cmd-list" role="listbox" className="max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain p-2">
          {flat.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-fg-3">No matches for “{query}”</p>
          ) : (
            groups.map((g) => (
              <div key={g.name} className="mb-1">
                <p className="eyebrow flex items-center gap-1.5 px-3 pb-1 pt-2">
                  {g.name === 'Recent' && <Clock size={10} />}
                  {g.name === 'Alerts' && <AlertTriangle size={10} className="text-warning" />}
                  {g.name}
                </p>
                {g.items.map((item) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  const isActive = idx === active;
                  const Icon = item.icon;
                  return (
                    <button
                      key={`${g.name}:${item.id}`}
                      id={`cmd-${item.id}`}
                      role="option"
                      aria-selected={isActive}
                      data-index={idx}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => execute(item)}
                      disabled={busy}
                      className={clsx(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                        isActive ? 'bg-primary/15 text-fg' : 'text-fg-2 hover:bg-line/5',
                      )}
                    >
                      <span
                        className={clsx(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                          item.tone === 'alert' ? 'bg-warning/15 text-warning' : item.tone === 'negative' ? 'bg-danger/15 text-danger' : isActive ? 'bg-primary/20 text-primary' : 'bg-line/5 text-fg-3',
                        )}
                      >
                        {Icon && <Icon size={14} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.label}</span>
                        {item.hint && <span className="block truncate text-[11px] text-fg-3">{item.hint}</span>}
                      </span>
                      {item.current && <Check size={13} className="text-primary" aria-label="current" />}
                      {item.recentOf && <span className="hidden text-[10px] text-fg-3 sm:block">{item.recentOf}</span>}
                      {isActive && <CornerDownLeft size={12} className="text-fg-3" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line/10 px-4 py-2 text-[11px] text-fg-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><kbd className="rounded border border-line/15 bg-line/5 px-1 font-mono"><ArrowUp size={9} className="inline" /></kbd><kbd className="rounded border border-line/15 bg-line/5 px-1 font-mono"><ArrowDown size={9} className="inline" /></kbd> navigate</span>
            <span className="inline-flex items-center gap-1"><kbd className="rounded border border-line/15 bg-line/5 px-1 font-mono">↵</kbd> select</span>
            <span className="hidden items-center gap-1 sm:inline-flex"><kbd className="rounded border border-line/15 bg-line/5 px-1 font-mono">esc</kbd> close</span>
          </div>
          <span className={clsx('truncate', status?.tone === 'error' ? 'text-danger' : 'text-fg-3')} aria-live="polite">
            {status?.text ?? `${flat.length} command${flat.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>
    </div>
  );
}
