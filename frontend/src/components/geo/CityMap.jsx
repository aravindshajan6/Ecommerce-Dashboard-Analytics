import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { useTheme } from '../../lib/theme.jsx';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { flagEmoji } from './flag.js';

// OpenStreetMap standard tiles (no API key). Dark theme is achieved with a CSS filter on the tile pane.
const TILES = {
  dark: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  light: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Scoped Leaflet tooltip skin (globals.css only themes popups/attribution).
const TIP_CSS = `
.leaflet-tooltip.nova-tip{background:rgb(var(--card));color:rgb(var(--fg));border:1px solid rgb(var(--line)/.15);border-radius:10px;box-shadow:0 10px 30px -10px rgb(0 0 0/.6);padding:6px 10px;font-size:12px;line-height:1.35}
.leaflet-tooltip.nova-tip::before{border-top-color:rgb(var(--card))}
.leaflet-tooltip-bottom.nova-tip::before{border-bottom-color:rgb(var(--card))}
.leaflet-bar a{background:rgb(var(--card));color:rgb(var(--fg));border-bottom-color:rgb(var(--line)/.15)}
.leaflet-bar a:hover{background:rgb(var(--card-hover))}
.nova-tiles-dark{filter:invert(1) hue-rotate(200deg) brightness(.72) contrast(.9) saturate(.5)}
.nova-tiles-light{filter:saturate(.55) contrast(.95)}
`;

/** Fits all points on mount / data change, flies to the selected point when it changes. */
function Focus({ points, selectedPoint }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPoint) {
      map.flyTo([selectedPoint.lat, selectedPoint.lng], Math.max(map.getZoom(), 7), { duration: 1.1 });
      return;
    }
    if (points.length === 0) return;
    if (points.length === 1) { map.setView([points[0].lat, points[0].lng], 6); return; }
    map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [32, 32], maxZoom: 8 });
  }, [map, points, selectedPoint]);
  return null;
}

/**
 * 2D Leaflet map. Props: { points, height = 480, selected (city string|null), onSelect(point|null), className }
 */
export default function CityMap({ points = [], height = 480, selected = null, onSelect, className = '' }) {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const valid = useMemo(() => points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)), [points]);
  const max = useMemo(() => Math.max(1, ...valid.map((p) => p.customers || 0)), [valid]);
  const selectedPoint = useMemo(() => valid.find((p) => p.city === selected) ?? null, [valid, selected]);
  const tiles = isDark ? TILES.dark : TILES.light;

  if (!mounted) return <div className={`shimmer rounded-2xl ${className}`} style={{ height }} />;

  return (
    <div className={`relative isolate z-0 overflow-hidden rounded-2xl ${className}`} style={{ height }}>
      <style>{TIP_CSS}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        preferCanvas
        worldCopyJump
        style={{ height: '100%', width: '100%' }}
        attributionControl
      >
        <TileLayer key={isDark ? 'dark' : 'light'} url={tiles} attribution={ATTRIBUTION} maxZoom={19} className={isDark ? 'nova-tiles-dark' : 'nova-tiles-light'} />
        <Focus points={valid} selectedPoint={selectedPoint} />
        {valid.map((p) => {
          const isSel = p.city === selected;
          const r = 4 + 22 * Math.sqrt((p.customers || 0) / max);
          return (
            <CircleMarker
              key={`${p.city}|${p.country}`}
              center={[p.lat, p.lng]}
              radius={isSel ? r + 3 : r}
              pathOptions={{
                color: isSel ? 'rgb(var(--pink))' : 'rgb(var(--primary))',
                weight: isSel ? 2.5 : 1.2,
                fillColor: isSel ? 'rgb(var(--pink))' : 'rgb(var(--primary))',
                fillOpacity: isSel ? 0.75 : 0.45,
              }}
              eventHandlers={{ click: () => onSelect?.(isSel ? null : p) }}
            >
              <Tooltip direction="top" offset={[0, -r]} opacity={1} className="nova-tip">
                <div>
                  <b>{flagEmoji(p.countryCode)} {p.city}</b>{p.country ? <span style={{ opacity: 0.7 }}> · {p.country}</span> : null}<br />
                  {fmtNumber(p.customers)} customers · {fmtNumber(p.orders)} orders · {fmtMoney(p.revenue)}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
