# Nova Commerce — Design System & Build Brief

## Direction
"Luxe Dark + Aurora": dark-first glassmorphism, bento grid, 3–4 accent hues max, 3D moments where they carry meaning
(order globe, floating data core, 3D cohort bars), anime.js for choreography (counters, staggered reveals, page transitions).
Light theme is fully supported via CSS variables (`html.dark` toggles).

## Tokens (see frontend/src/styles/globals.css + tailwind.config.js)
Tailwind classes: `bg-bg`, `bg-panel`, `bg-card`, `text-fg`, `text-fg-2`, `text-fg-3`, `border-line/10`,
accents `primary` (#6366F1 indigo), `teal` (#2DD4BF), `pink` (#EC4899), `violet` (#8B5CF6), `success`, `danger`, `warning`.
In JS/SVG use `rgb(var(--primary))` etc. so charts follow the theme.
Fonts: `font-display` (Space Grotesk) for headings/KPIs, `font-sans` (Inter) body, `font-mono` (JetBrains Mono) for ids.

## Utility classes
`.glass` (+ `.spot` spotlight hover, `.gradient-border` animated conic border), `.shimmer` skeleton, `.text-gradient`,
`.eyebrow`, `.kpi-number`, `.pill`, `.btn-primary`, `.btn-ghost`, `.segmented` (+ `data-active`), `.input`, `.table`, `.live-dot`.

## Components (frontend/src/components)
- ui/: GlassCard, KpiCard, DeltaPill, Sparkline, Segmented, Badge, Avatar, DataTable, PageHeader, EmptyState/ErrorState, Skeleton/ChartSkeleton/TableSkeleton — import from `components/ui/index.js`.
- layout/: AppShell (sidebar + topbar + ⌘K palette + aurora backdrop), Sidebar (NAV), Topbar (global date range), Logo.
- charts/: theme.js (palette + shared axis props), ChartTooltip.jsx (glass tooltip) + feature charts.
- three/: AuroraParticles, HeroScene (revenue terrain: instanced bar field from /api/sales/heatmap + scan wave, peak pins, radar rings, orbiting insight tiles), Globe, DataCore, CohortBars, ProductPodium (react-three-fiber).
- insights/: InsightCard, InsightsPanel.
- landing/: LandingNav, Hero, Marquee, StatRibbon (SVG ring draw + counters), Features, HowItWorks
  (dash-offset connector draw + timeline), CohortShowcase (anime.js grid stagger), LiveInsights,
  FaqSection (height accordion), TechStrip, CtaBand, Footer. `useInViewOnce` fires each section's
  timeline the first time it scrolls into view.

## Data
- `hooks/useApi.js` wraps every endpoint in docs/API.md with TanStack Query. The global date range (`lib/range.jsx`) is applied automatically.
- `lib/format.js`: fmtMoney (compact ₹), fmtNumber, fmtPct, fmtDate, timeAgo.
- `lib/motion.js` + `hooks/useAnime.js`: countUp, revealStagger, drawSvg, useAnimeScope, useCountUp, useReveal.

## Layout grid
Pages use `grid grid-cols-12 gap-4`. Tile spans: KPI `col-span-12 sm:col-span-6 xl:col-span-3`, hero chart `col-span-12 xl:col-span-8`,
side panel `col-span-12 xl:col-span-4`, half `col-span-12 lg:col-span-6`. Every tile has a min-height and a same-size skeleton.

## anime.js ↔ three.js bridge (components/three/anime3d.js)
anime.js cannot write into an instanced matrix or a `THREE.Object3D` transform directly, so the split is:
- **anime.js owns the choreography** — timelines, staggers and easings over arrays of `{ v }` progress
  proxies (`makeProgress(n)`).
- **`useFrame` owns the render** — each frame it reads those values and applies them to three.js.

This gives the 3D scenes the same vocabulary as the DOM animations. In use:
- `HeroScene` — `stagger(11, { grid: [24, 7], from: 'center' })` blooms the revenue terrain outward,
  then `outElastic` pops the peak pins and `outBack` pops the insight tiles, all on one timeline.
- `ProductPodium` — `stagger(150, { from: 'center' })` with `outBack` raises the three pillars.
- `CohortBars` — `stagger(16, { grid: [months, cohorts] })` raises the 3D retention surface.

Gotcha worth remembering: never depend on a prop array (e.g. `products`) in the effect that starts
these timelines — a fresh array identity every render restarts the timeline and pins progress at 0.
Depend on a stable signature string instead.

## 3D rules (components/three)
Every scene goes through `SceneCanvas.jsx`, which is the only place a `<Canvas>` is created:
- **Lazy mount on first sight.** react-three-fiber never starts its render loop for a Canvas that mounts
  off-screen, which leaves the scene blank forever. `useSeen()` latches when the container first enters the
  viewport and only then mounts the Canvas. Once mounted, `frameloop` drops to `'demand'` when the scene
  scrolls away (keeps the last frame, no CPU) and returns to `'always'` when it is back in view.
- **A `<Suspense>` boundary inside the Canvas.** r3f v9 has none built in, and drei's `Text` / `useTexture`
  suspend — without a boundary the entire scene disappears.
- `dpr={[1, 1.5]}`, `alpha: true`, `powerPreference: 'high-performance'`.
- No `Environment preset` (it fetches an HDR from a CDN). Lighting is local: `Environment` with
  `Lightformer` children plus ambient/directional/point lights.
- Reduced motion or no WebGL → `StaticFallback` (an on-brand gradient), and every Canvas is wrapped in
  `ThreeErrorBoundary`.
- Colours come from `palette.js` (`usePalette()`), which reads the CSS variables so 3D follows the theme.
- Geometries/materials are always `useMemo`'d, never created during render.

## Motion rules
- Respect `prefers-reduced-motion` (helpers already do). Reveal on mount with stagger ≤ 80ms; counters ≤ 1.4s `outExpo`.
- 3D canvases: `dpr={[1, 1.5]}`, pause (`frameloop="demand"` or unmount) when off-screen; no WebGL under reduced motion — show a static gradient fallback.
