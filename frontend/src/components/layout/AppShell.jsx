import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import CommandPalette from './CommandPalette.jsx';
import { useAnimeScope } from '../../hooks/useAnime.js';
import { animate } from 'animejs';
import { lazy, Suspense } from 'react';

const AuroraParticles = lazy(() => import('../three/AuroraParticles.jsx'));

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('nova:sidebar') === '1'; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { pathname } = useLocation();
  const section = pathname.split('/')[1] || 'home'; // key transitions on the section, not sub-routes (e.g. /orders/:id)

  useEffect(() => { try { localStorage.setItem('nova:sidebar', collapsed ? '1' : '0'); } catch { /* ignore */ } }, [collapsed]);

  // ⌘K / Ctrl+K opens the palette anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
      if (e.key === 'Escape') { setPaletteOpen(false); setMobileOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Page transition: fade/slide the outlet on route change.
  const pageRef = useAnimeScope((_, root) => {
    animate(root, { opacity: [0, 1], translateY: [10, 0], duration: 500, ease: 'outCubic' });
  }, [section]);

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  return (
    <div className="min-h-screen">
      <div className="aurora" aria-hidden="true" />
      <Suspense fallback={null}><AuroraParticles /></Suspense>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={clsx('flex min-h-screen flex-col transition-[padding] duration-300', collapsed ? 'lg:pl-[72px]' : 'lg:pl-60')}>
        <Topbar onMenu={() => setMobileOpen(true)} onOpenPalette={openPalette} />
        <main ref={pageRef} className="flex-1 px-4 py-6 md:px-6 lg:px-8" style={{ overflowX: 'clip' }} key={section}>
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
        <footer className="px-6 py-4 text-center text-[11px] text-fg-3">
          Nova Commerce Analytics · React 19 · Three.js · anime.js · Recharts
        </footer>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
