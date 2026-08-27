import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Globe as GlobeIcon, Map as MapIcon } from 'lucide-react';
import { PageHeader, Segmented, GlassCard, ErrorState, EmptyState, Skeleton } from '../components/ui/index.js';
import Globe from '../components/three/Globe.jsx';
import CityRanking from '../components/geo/CityRanking.jsx';
import GeoStats from '../components/geo/GeoStats.jsx';
import TopCitiesBar from '../components/geo/TopCitiesBar.jsx';
import CountryDonut from '../components/geo/CountryDonut.jsx';
import { useGeo } from '../hooks/useApi.js';
import { fmtNumber } from '../lib/format.js';

// Leaflet is only needed for the 2D view — keep it out of the page chunk.
const CityMap = lazy(() => import('../components/geo/CityMap.jsx'));

const VIEWS = [{ value: 'globe', label: '3D globe' }, { value: 'map', label: '2D map' }];

/** Normalise `{ points, unknown }` (docs) — tolerate a bare array — and rank cities by customers. */
function normalise(data) {
  const raw = Array.isArray(data) ? data : Array.isArray(data?.points) ? data.points : [];
  const unknown = Array.isArray(data) ? 0 : Number(data?.unknown) || 0;
  const total = raw.reduce((s, p) => s + (p.customers || 0), 0) || 1;
  const points = [...raw]
    .sort((a, b) => (b.customers || 0) - (a.customers || 0))
    .map((p, i) => ({ ...p, rank: i + 1, share: (p.customers || 0) / total }));
  return { points, unknown, total };
}

function useIsNarrow(px = 640) {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${px}px)`).matches);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px}px)`);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [px]);
  return narrow;
}

export default function Geography() {
  const [view, setView] = useState('globe');
  const [selected, setSelected] = useState(null);
  const { data, isPending, error, refetch } = useGeo();
  const { points, unknown, total } = useMemo(() => normalise(data), [data]);
  const narrow = useIsNarrow();
  const height = narrow ? 420 : 560;

  // Globe/map hand back a point (or null); the ranking hands back a city name — accept both.
  const onSelect = useCallback((p) => setSelected(p == null ? null : typeof p === 'string' ? p : p.city ?? null), []);
  const common = { points, loading: isPending, error, retry: refetch };

  return (
    <>
      <PageHeader
        eyebrow="Where customers are"
        title="Geography"
        description="Customer and revenue distribution by city."
        actions={<Segmented options={VIEWS} value={view} onChange={setView} />}
      />

      <div className="grid grid-cols-12 gap-4">
        <GeoStats className="col-span-12" points={points} unknown={unknown} loading={isPending} />

        <GlassCard
          title={view === 'globe' ? 'Customer globe' : 'Customer map'}
          subtitle={isPending ? 'Loading cities…' : `${fmtNumber(points.length)} cities · ${fmtNumber(total)} customers · marker size = customers`}
          icon={view === 'globe' ? GlobeIcon : MapIcon}
          className="col-span-12 xl:col-span-8"
          bodyClassName="!px-3 !pb-3"
        >
          {isPending ? (
            <Skeleton className="w-full rounded-2xl" style={{ height }} />
          ) : error ? (
            <div className="grid place-items-center" style={{ height }}><ErrorState error={error} retry={refetch} /></div>
          ) : points.length === 0 ? (
            <div className="grid place-items-center" style={{ height }}><EmptyState title="No geocoded customers" body="Cities are matched against the bundled city table on the server." /></div>
          ) : view === 'globe' ? (
            <Globe points={points} height={height} selected={selected} onSelect={onSelect} />
          ) : (
            <Suspense fallback={<Skeleton className="w-full rounded-2xl" style={{ height }} />}>
              <CityMap points={points} height={height} selected={selected} onSelect={onSelect} />
            </Suspense>
          )}
        </GlassCard>

        <CityRanking className="col-span-12 xl:col-span-4" {...common} selected={selected} onSelect={onSelect} />

        <TopCitiesBar className="col-span-12 lg:col-span-6" {...common} selected={selected} onSelect={onSelect} />
        <CountryDonut className="col-span-12 lg:col-span-6" {...common} />
      </div>
    </>
  );
}
