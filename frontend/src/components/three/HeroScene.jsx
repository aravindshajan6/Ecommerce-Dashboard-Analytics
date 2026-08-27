/* eslint-disable react/no-unknown-property */
/**
 * HeroScene — "revenue terrain".
 *
 * A 24 × 7 field of solid bars: one column per hour of the day, one row per weekday, each bar's
 * height driven by real revenue for that slot (/api/sales/heatmap). Layered on top:
 *   · a scan wave that lifts and brightens bars as it travels across the field
 *   · floating pins over the peak slots
 *   · radar rings pulsing out from the busiest slot
 *   · billboarded insight tiles (peak hour / busiest day / quietest hour) orbiting the field
 *   · drifting motes for ambient depth
 * Solid, well-lit geometry with hard silhouettes — the approach that makes the product podium read
 * well — rather than a diffuse particle cloud.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, RoundedBox, Sparkles, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme.jsx';
import { useSalesHeatmap } from '../../hooks/useApi.js';
import { usePalette } from './palette.js';
import SceneCanvas from './SceneCanvas.jsx';
import { useWindowPointer } from './useInView.js';
import { FONT_URL, clamp01, damp, getGlowTexture, gradient3, makeGridTexture } from './shared.js';
import { createTimeline, makeProgress, setProgress, stagger } from './anime3d.js';
import { prefersReducedMotion } from '../../lib/motion.js';

const HOURS = 24;
const DAYS = 7;
const CELLS = HOURS * DAYS;

const STEP_X = 0.31;
const STEP_Z = 0.40;
const BAR_W = 0.22;
const BAR_D = 0.30;
const MAX_H = 2.0;
const MIN_H = 0.055;

const FIELD_W = (HOURS - 1) * STEP_X;
const FIELD_D = (DAYS - 1) * STEP_Z;

const SWEEP_SPEED = 1.5;
const SWEEP_SPAN = FIELD_W + 5;
/** Shared so the wave, the colour lift and the glow sprite all ride the same scan line. */
const sweepAt = (t) => ((t * SWEEP_SPEED) % SWEEP_SPAN) - FIELD_W / 2 - 2.5;

const cellX = (h) => h * STEP_X - FIELD_W / 2;
const cellZ = (d) => d * STEP_Z - FIELD_D / 2;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hourLabel = (h) => `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`;

/** Deterministic stand-in so the hero never renders an empty field while the request is in flight. */
function fallbackCells() {
  const out = [];
  for (let d = 0; d < DAYS; d++) {
    for (let h = 0; h < HOURS; h++) {
      const lunch = Math.exp(-((h - 12.5) ** 2) / 6) * 0.7;
      const evening = Math.exp(-((h - 20.5) ** 2) / 8) * 1.0;
      const night = h < 6 ? 0.06 : 0;
      const weekend = d === 0 || d === 6 ? 1.22 : 1;
      out.push({ dow: d, hour: h, revenue: (lunch + evening + night) * weekend });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ derived shape of the data */
function useTerrainData(cells) {
  return useMemo(() => {
    const heights = new Float32Array(CELLS);
    const raw = new Float32Array(CELLS);
    let max = 0;
    for (const c of cells) if ((c.revenue || 0) > max) max = c.revenue || 0;
    if (max <= 0) max = 1;
    for (const c of cells) {
      const d = Number(c.dow), h = Number(c.hour);
      if (!Number.isFinite(d) || !Number.isFinite(h) || d < 0 || d >= DAYS || h < 0 || h >= HOURS) continue;
      raw[d * HOURS + h] = c.revenue || 0;
      // mild power curve so quiet hours keep some body instead of collapsing flat
      heights[d * HOURS + h] = Math.pow(clamp01((c.revenue || 0) / max), 0.72);
    }

    // top slots get a floating pin
    const order = Array.from({ length: CELLS }, (_, i) => i).sort((a, b) => heights[b] - heights[a]);
    const peaks = order.slice(0, 7).map((i) => ({
      i,
      h: i % HOURS,
      d: Math.floor(i / HOURS),
      height: MIN_H + heights[i] * MAX_H,
    }));

    // aggregates behind the orbiting tiles
    const byHour = new Array(HOURS).fill(0);
    const byDay = new Array(DAYS).fill(0);
    for (let d = 0; d < DAYS; d++) {
      for (let h = 0; h < HOURS; h++) {
        byHour[h] += raw[d * HOURS + h];
        byDay[d] += raw[d * HOURS + h];
      }
    }
    const peakHour = byHour.indexOf(Math.max(...byHour));
    const quietHour = byHour.indexOf(Math.min(...byHour));
    const busiestDay = byDay.indexOf(Math.max(...byDay));

    return { heights, peaks, peakHour, quietHour, busiestDay };
  }, [cells]);
}

/* ------------------------------------------------------------------ the bar field */
function Terrain({ heights, grow, p, isDark }) {
  const meshRef = useRef(null);

  const geom = useMemo(() => {
    // unit-height box pivoted at its base so a y-scale grows it upward
    const g = new THREE.BoxGeometry(BAR_W, 1, BAR_D);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    metalness: 0.28,
    roughness: 0.26,
    emissive: new THREE.Color(isDark ? '#140f33' : '#ffffff'),
    emissiveIntensity: isDark ? 0.35 : 0.05,
  }), [isDark]);

  useEffect(() => () => { geom.dispose(); mat.dispose(); }, [geom, mat]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const white = useMemo(() => new THREE.Color('#ffffff'), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const now = state.clock.elapsedTime;
    const sweepX = sweepAt(now);

    for (let d = 0; d < DAYS; d++) {
      for (let h = 0; h < HOURS; h++) {
        const i = d * HOURS + h;
        const x = cellX(h);
        const z = cellZ(d);

        // rise driven by the anime.js grid stagger (see Scene's timeline), not a hand-rolled curve
        const g = grow[i]?.v ?? 1;
        const base = MIN_H + heights[i] * MAX_H;

        // the scan wave briefly lifts bars as it passes over them
        const dx = x - sweepX;
        const wave = Math.exp(-(dx * dx) / 0.32);
        const hgt = Math.max(0.001, (base + base * wave * 0.28) * g);

        dummy.position.set(x, 0, z);
        dummy.scale.set(1, hgt, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        // ^1.6 keeps the field mostly teal→indigo so pink reads as a real peak, not noise
        gradient3(Math.pow(heights[i], 1.6), p.teal, p.primary, p.pink, col);
        if (wave > 0.01) col.lerp(white, wave * (isDark ? 0.34 : 0.24));
        mesh.setColorAt(i, col);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geom, mat, CELLS]} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ pins over the peak slots */
function PeakPins({ peaks, grow, p, isDark }) {
  const groupRef = useRef(null);
  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const now = state.clock.elapsedTime;
    g.children.forEach((child, k) => {
      // anime.js supplies the pop-in (outElastic); useFrame adds the idle bob
      const on = grow[k]?.v ?? 1;
      child.visible = on > 0.02;
      child.scale.setScalar(on * (1.0 + Math.sin(now * 1.6 + k) * 0.12));
      child.rotation.y = now * 0.9 + k;
      child.position.y = child.userData.baseY + 0.16 + Math.sin(now * 1.5 + k * 1.3) * 0.09;
    });
  });

  return (
    <group ref={groupRef}>
      {peaks.map((pk) => (
        <mesh
          key={pk.i}
          position={[cellX(pk.h), pk.height, cellZ(pk.d)]}
          userData={{ baseY: pk.height }}
          rotation-x={Math.PI / 5}
        >
          <octahedronGeometry args={[0.15, 0]} />
          <meshBasicMaterial color={p.pink} toneMapped={false} transparent opacity={isDark ? 0.95 : 0.85} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ radar rings from the busiest slot */
const RING_COUNT = 3;
function RadarRings({ origin, p, isDark }) {
  const refs = useRef([]);
  useFrame((state) => {
    const now = state.clock.elapsedTime;
    for (let k = 0; k < RING_COUNT; k++) {
      const m = refs.current[k];
      if (!m) continue;
      const phase = ((now * 0.42) + k / RING_COUNT) % 1;
      const s = 0.25 + phase * 4.6;
      m.scale.set(s, s, s);
      m.material.opacity = (1 - phase) * (isDark ? 0.5 : 0.32);
    }
  });
  return (
    <group position={[origin[0], 0.014, origin[1]]} rotation-x={-Math.PI / 2}>
      {Array.from({ length: RING_COUNT }).map((_, k) => (
        <mesh key={k} ref={(el) => { refs.current[k] = el; }}>
          <ringGeometry args={[0.42, 0.5, 72]} />
          <meshBasicMaterial color={p.teal} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ orbiting insight tiles */
function InsightTile({ label, value, color, angle, radius, y, speed, grow, p, isDark }) {
  const ref = useRef(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const now = state.clock.elapsedTime;
    const a = angle + now * speed;
    g.position.set(Math.cos(a) * radius, y + Math.sin(now * 0.9 + angle) * 0.13, Math.sin(a) * radius);
    const on = grow?.v ?? 1;   // anime.js outBack entrance
    g.scale.setScalar(on);
    g.visible = on > 0.02;
  });

  return (
    <group ref={ref}>
      <Billboard>
        <RoundedBox args={[1.42, 0.66, 0.1]} radius={0.055} smoothness={3}>
          <meshStandardMaterial
            color={isDark ? p.card : '#ffffff'}
            transparent
            opacity={isDark ? 0.94 : 0.96}
            metalness={0.1}
            roughness={0.45}
            emissive={color}
            emissiveIntensity={isDark ? 0.07 : 0.03}
          />
        </RoundedBox>
        <Text font={FONT_URL} fontSize={0.098} color={color} anchorX="center" anchorY="middle" position={[0, 0.16, 0.06]}>
          {label}
        </Text>
        <Text
          font={FONT_URL}
          fontSize={0.215}
          color={isDark ? '#f4f2ff' : '#110f24'}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.1, 0.06]}
        >
          {value}
        </Text>
      </Billboard>
    </group>
  );
}

/* ------------------------------------------------------------------ scenery */
function Sweep({ p, isDark }) {
  const ref = useRef(null);
  const glow = useMemo(getGlowTexture, []);
  useFrame((state) => {
    if (ref.current) ref.current.position.x = sweepAt(state.clock.elapsedTime);
  });
  return (
    <sprite ref={ref} position={[0, 0.12, 0]} scale={[1.0, FIELD_D + 1.8, 1]}>
      <spriteMaterial
        map={glow}
        color={p.teal}
        transparent
        opacity={isDark ? 0.22 : 0.14}
        depthWrite={false}
        toneMapped={false}
        blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </sprite>
  );
}

function Floor({ p, isDark }) {
  const grid = useMemo(
    () => makeGridTexture(isDark ? p.css.primary : p.css.violet, { cells: 26, alpha: isDark ? 0.6 : 0.45 }),
    [p, isDark],
  );
  useEffect(() => () => grid.dispose?.(), [grid]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.012, 0]}>
      <planeGeometry args={[FIELD_W + 6, FIELD_D + 6]} />
      <meshBasicMaterial map={grid} transparent opacity={isDark ? 0.34 : 0.4} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ scene */
function Scene({ p, isDark, pointer, cells }) {
  const group = useRef(null);
  const { heights, peaks, peakHour, quietHour, busiestDay } = useTerrainData(cells);

  // ---- anime.js choreography for the 3D scene -------------------------------------------------
  // Progress proxies that anime.js staggers over; the meshes read them every frame.
  const barGrow = useMemo(() => makeProgress(CELLS), []);
  const pinGrow = useMemo(() => makeProgress(peaks.length || 1), [peaks.length]);
  const tileGrow = useMemo(() => makeProgress(3), []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setProgress(barGrow); setProgress(pinGrow); setProgress(tileGrow);
      return undefined;
    }
    setProgress(barGrow, 0); setProgress(pinGrow, 0); setProgress(tileGrow, 0);

    const tl = createTimeline({ defaults: { ease: 'outCubic' } });
    // the field blooms outward from the middle of the week — grid-aware stagger over 24 × 7 cells
    tl.add(barGrow, {
      v: [0, 1],
      duration: 820,
      delay: stagger(11, { grid: [HOURS, DAYS], from: 'center' }),
    }, 0);
    // peaks snap in with an elastic overshoot once the field has risen
    tl.add(pinGrow, {
      v: [0, 1],
      duration: 900,
      ease: 'outElastic(1, .6)',
      delay: stagger(90),
    }, 900);
    // then the insight tiles pop
    tl.add(tileGrow, {
      v: [0, 1],
      duration: 700,
      ease: 'outBack',
      delay: stagger(130),
    }, 1150);

    return () => tl.pause?.();
  }, [barGrow, pinGrow, tileGrow, heights]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(dt, 0.05);
    const sway = -0.95 + Math.sin(state.clock.elapsedTime * 0.16) * 0.11;
    g.rotation.y = damp(g.rotation.y, sway + pointer.current.x * 0.22, 2.4, d);
    g.rotation.x = damp(g.rotation.x, 0.02 - pointer.current.y * 0.06, 2.4, d);
  });

  const top = peaks[0];
  const radarOrigin = top ? [cellX(top.h), cellZ(top.d)] : [0, 0];

  return (
    <>
      <ambientLight intensity={isDark ? 0.55 : 0.8} />
      <directionalLight position={[4, 8, 5]} intensity={isDark ? 1.5 : 2.6} />
      <pointLight position={[-5, 3.5, 3]} intensity={isDark ? 34 : 16} color={p.primary} distance={22} decay={2} />
      <pointLight position={[5, 2.5, -2]} intensity={isDark ? 26 : 12} color={p.pink} distance={20} decay={2} />
      <pointLight position={[0, 1.4, 5]} intensity={isDark ? 18 : 8} color={p.teal} distance={16} decay={2} />
      {isDark && <Stars radius={45} depth={24} count={700} factor={2.4} fade speed={0.4} />}

      <group ref={group} position={[0, -0.55, 0]} scale={0.86}>
        <Floor p={p} isDark={isDark} />
        <Sweep p={p} isDark={isDark} />
        <RadarRings origin={radarOrigin} p={p} isDark={isDark} />
        <Terrain heights={heights} grow={barGrow} p={p} isDark={isDark} />
        <PeakPins peaks={peaks} grow={pinGrow} p={p} isDark={isDark} />

        {/* ambient motes drifting above the field */}
        <Sparkles
          count={70}
          scale={[FIELD_W + 1.5, 2.6, FIELD_D + 1.5]}
          position={[0, 1.6, 0]}
          size={2.2}
          speed={0.35}
          opacity={isDark ? 0.65 : 0.4}
          color={p.css.teal}
        />

        <InsightTile
          label="PEAK HOUR" value={hourLabel(peakHour)} color={p.css.pink}
          angle={0.2} radius={3.35} y={2.62} speed={0.17} grow={tileGrow[0]} p={p} isDark={isDark}
        />
        <InsightTile
          label="BUSIEST DAY" value={DAY_NAMES[busiestDay]} color={p.css.teal}
          angle={2.3} radius={3.35} y={2.16} speed={0.17} grow={tileGrow[1]} p={p} isDark={isDark}
        />
        <InsightTile
          label="QUIETEST" value={hourLabel(quietHour)} color={p.css.primary}
          angle={4.4} radius={3.35} y={2.95} speed={0.17} grow={tileGrow[2]} p={p} isDark={isDark}
        />
      </group>
    </>
  );
}

export default function HeroScene({ className = '' }) {
  const { isDark } = useTheme();
  const p = usePalette();
  const pointer = useWindowPointer();
  const { data } = useSalesHeatmap();

  const cells = useMemo(() => (Array.isArray(data) && data.length ? data : fallbackCells()), [data]);

  return (
    <SceneCanvas
      className={`h-full w-full min-h-[380px] md:min-h-[520px] ${className}`}
      height="100%"
      rounded=""
      camera={{ fov: 36, position: [0, 3.4, 9.7], near: 0.1, far: 80 }}
      fallbackVariant="gradient"
      fallbackMessage="Revenue terrain"
    >
      <Scene p={p} isDark={isDark} pointer={pointer} cells={cells} />
    </SceneCanvas>
  );
}
