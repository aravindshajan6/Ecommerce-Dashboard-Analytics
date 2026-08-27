/* eslint-disable react/no-unknown-property */
/**
 * CohortBars — 3D retention surface. x = cohort, z = months since first purchase, height = retention %
 * (0–100 → 0–2 units), colour teal → indigo → pink by value. Bars rise on mount, hover shows a tooltip.
 * Props: { cohorts: [{ cohort, label, customers, revenue, ltv, retention: number[] }], height = 360, className }
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Text, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme.jsx';
import { fmtPct } from '../../lib/format.js';
import { usePalette } from './palette.js';
import SceneCanvas from './SceneCanvas.jsx';
import { FONT_URL, gradient3, makeGridTexture } from './shared.js';
import { createTimeline, makeProgress, setProgress, stagger } from './anime3d.js';
import { prefersReducedMotion } from '../../lib/motion.js';

const SPACING = 0.62;
const BAR = 0.42;
const MAX_H = 2;

function useCells(cohorts, months) {
  return useMemo(() => {
    const cells = [];
    cohorts.forEach((c, i) => {
      for (let k = 0; k < months; k++) {
        const v = Number(c.retention?.[k]);
        if (!Number.isFinite(v)) continue;
        const pct = Math.max(0, Math.min(100, v));
        cells.push({ i, k, pct, x: i * SPACING, z: k * SPACING, h: Math.max(0.03, (pct / 100) * MAX_H), cohort: c });
      }
    });
    return cells;
  }, [cohorts, months]);
}

function Bars({ cells, p, isDark, hovered, setHovered }) {
  const mesh = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(BAR, 1, BAR);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const colors = useMemo(() => cells.map((c) => gradient3(c.pct / 100, p.teal, p.primary, p.pink)), [cells, p]);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const hi = new THREE.Color();
    colors.forEach((c, idx) => m.setColorAt(idx, hovered === idx ? hi.copy(c).lerp(p.fg, 0.45) : c));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [colors, hovered, p]);

  // anime.js grid stagger over the cohort × month matrix drives the rise
  const rise = useMemo(() => makeProgress(Math.max(1, cells.length)), [cells.length]);
  useEffect(() => {
    if (prefersReducedMotion()) { setProgress(rise); return undefined; }
    setProgress(rise, 0);
    const cols = Math.max(1, ...cells.map((c) => c.k + 1));
    const rows = Math.max(1, ...cells.map((c) => c.i + 1));
    const tl = createTimeline();
    tl.add(rise, {
      v: [0, 1],
      duration: 900,
      ease: 'outCubic',
      delay: stagger(16, { grid: [cols, rows], from: 'first' }),
    }, 60);
    return () => tl.pause?.();
  }, [rise, cells]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    for (let idx = 0; idx < cells.length; idx++) {
      const c = cells[idx];
      const s = rise[idx]?.v ?? 1;
      const w = hovered === idx ? 1.12 : 1;
      dummy.position.set(c.x, 0, c.z);
      dummy.scale.set(w, c.h * s + 0.0001, w);
      dummy.updateMatrix();
      m.setMatrixAt(idx, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      key={cells.length}
      args={[undefined, undefined, Math.max(1, cells.length)]}
      geometry={geometry}
      frustumCulled={false}
      onPointerMove={(e) => { e.stopPropagation(); if (e.instanceId != null && e.instanceId !== hovered) setHovered(e.instanceId); }}
      onPointerOut={() => setHovered(null)}
    >
      <meshStandardMaterial roughness={0.32} metalness={0.15} emissive={p.primary} emissiveIntensity={isDark ? 0.18 : 0.08} />
    </instancedMesh>
  );
}

function Labels({ cohorts, months, p }) {
  const color = p.css.fg2;
  const depth = (months - 1) * SPACING;
  return (
    <group>
      {cohorts.map((c, i) => (
        <Text
          key={`c-${i}`}
          font={FONT_URL}
          fontSize={0.21}
          color={color}
          anchorX="left"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, Math.PI / 4]}
          position={[i * SPACING - 0.05, 0.01, depth + 0.45]}
        >
          {String(c.label ?? c.cohort ?? i + 1)}
        </Text>
      ))}
      {Array.from({ length: months }, (_, k) => (
        <Text
          key={`m-${k}`}
          font={FONT_URL}
          fontSize={0.2}
          color={color}
          anchorX="right"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-0.45, 0.01, k * SPACING]}
        >
          {`M${k}`}
        </Text>
      ))}
    </group>
  );
}

function Floor({ p, isDark, w, d }) {
  const grid = useMemo(() => makeGridTexture(isDark ? p.css.primary : p.css.violet, { cells: 20 }), [p, isDark]);
  useEffect(() => () => grid.dispose(), [grid]);
  const size = Math.max(w, d) * 2.4 + 4;
  return (
    <mesh rotation-x={-Math.PI / 2} position={[w / 2, -0.01, d / 2]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={grid} transparent opacity={isDark ? 0.35 : 0.4} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Scene({ cohorts, months, p, isDark }) {
  const cells = useCells(cohorts, months);
  const [hovered, setHovered] = useState(null);
  useCursor(hovered != null);
  const w = Math.max(0, (cohorts.length - 1) * SPACING);
  const d = Math.max(0, (months - 1) * SPACING);
  const hoveredCell = hovered != null ? cells[hovered] : null;

  return (
    <>
      <ambientLight intensity={isDark ? 0.7 : 1.2} />
      <directionalLight position={[4, 9, 3]} intensity={isDark ? 1.8 : 2.4} />
      <pointLight position={[-3, 5, -3]} intensity={isDark ? 28 : 16} color={p.pink} distance={20} decay={2} />
      <pointLight position={[5, 4, 5]} intensity={isDark ? 26 : 14} color={p.teal} distance={20} decay={2} />
      <group position={[-w / 2, 0, -d / 2]}>
        <Bars cells={cells} p={p} isDark={isDark} hovered={hovered} setHovered={setHovered} />
        <Labels cohorts={cohorts} months={months} p={p} />
        <Floor p={p} isDark={isDark} w={w} d={d} />
        {hoveredCell && (
          <Html position={[hoveredCell.x, hoveredCell.h + 0.2, hoveredCell.z]} center zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap rounded-xl border border-line/10 bg-card/90 px-3 py-2 text-[11px] leading-tight text-fg shadow-card backdrop-blur-md" style={{ transform: 'translateY(-60%)' }}>
              <div className="font-display text-xs font-semibold">{String(hoveredCell.cohort.label ?? hoveredCell.cohort.cohort)}</div>
              <div className="mt-0.5 tabular text-fg-2">
                Month {hoveredCell.k} · <span style={{ color: p.css.teal }}>{fmtPct(hoveredCell.pct)}</span> retained
              </div>
            </div>
          </Html>
        )}
      </group>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={3}
        maxDistance={40}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.08}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

export default function CohortBars({ cohorts = [], height = 360, className = '' }) {
  const { isDark } = useTheme();
  const p = usePalette();
  const months = useMemo(() => Math.max(1, Math.min(12, ...cohorts.map((c) => c.retention?.length || 0))), [cohorts]);
  const camera = useMemo(() => {
    const w = (cohorts.length - 1) * SPACING;
    const d = (months - 1) * SPACING;
    const dist = Math.max(w, d) * 1.05 + 3.5;
    return { fov: 38, position: [dist * 0.78, dist * 0.66, dist * 0.88], near: 0.1, far: 120 };
  }, [cohorts.length, months]);

  return (
    <SceneCanvas className={className} height={height} camera={camera} fallbackMessage="Retention surface">
      <Scene cohorts={cohorts} months={months} p={p} isDark={isDark} />
    </SceneCanvas>
  );
}
