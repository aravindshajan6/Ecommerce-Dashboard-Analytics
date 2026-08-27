/* eslint-disable react/no-unknown-property */
/**
 * ProductPodium — top-3 podium. Rounded pillars (heights ∝ revenue) in primary / teal / violet with neon
 * caps and glow, a floating glass orb with the rank above each, the product title below.
 * Whole group sways ±10° and follows the pointer; hover shows revenue / units.
 * Props: { products: [{ id, title, revenue, units, category }], height = 300, className }
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, ContactShadows, Environment, Float, Html, Lightformer, RoundedBox, Text, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme.jsx';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { usePalette } from './palette.js';
import SceneCanvas from './SceneCanvas.jsx';
import { FONT_URL, damp, getGlowTexture, makeGridTexture, truncate } from './shared.js';
import { createTimeline, makeProgress, setProgress, stagger } from './anime3d.js';
import { prefersReducedMotion } from '../../lib/motion.js';

const SLOT_X = [-1.6, 0, 1.6]; // podium slots: 2nd, 1st, 3rd
const SLOT_RANK = [1, 0, 2];

function Pillar({ product, rank, x, height, color, p, isDark, hovered, setHovered, glow, progress }) {
  const grow = useRef(null);
  useFrame(() => {
    const g = grow.current;
    if (!g) return;
    // height comes from the anime.js timeline in Scene (outBack stagger across the three pillars)
    g.scale.y = Math.max(0.0001, progress?.v ?? 1);
  });
  const cap = useMemo(() => color.clone().lerp(p.fg, 0.45), [color, p]);

  return (
    <group position={[x, 0, 0]}>
      <group ref={grow} scale={[1, 0.0001, 1]}>
        <RoundedBox
          args={[1.15, height, 1.15]}
          radius={0.08}
          smoothness={4}
          position={[0, height / 2, 0]}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(rank); }}
          onPointerOut={() => setHovered(null)}
        >
          <meshPhysicalMaterial
            color={color}
            metalness={0.35}
            roughness={0.22}
            clearcoat={1}
            clearcoatRoughness={0.12}
            emissive={color}
            emissiveIntensity={hovered ? 0.55 : isDark ? 0.22 : 0.1}
            envMapIntensity={1.2}
          />
        </RoundedBox>
        {/* neon cap + base rim */}
        <mesh position={[0, height + 0.006, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.0, 1.0]} />
          <meshBasicMaterial color={cap} toneMapped={false} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.86, 0.9, 48]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <sprite position={[0, height + 0.05, 0]} scale={[2.2, 1.2, 1]}>
          <spriteMaterial map={glow} color={color} transparent opacity={isDark ? 0.55 : 0.3} blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      </group>

      <Float speed={2} rotationIntensity={0} floatIntensity={0.7}>
        <group position={[0, height + 0.62, 0]}>
          <mesh>
            <sphereGeometry args={[0.3, 48, 48]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={isDark ? 0.22 : 0.35} roughness={0.05} metalness={0} clearcoat={1} envMapIntensity={2} depthWrite={false} />
          </mesh>
          <sprite scale={[1.3, 1.3, 1]}>
            <spriteMaterial map={glow} color={color} transparent opacity={isDark ? 0.8 : 0.4} blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending} depthWrite={false} depthTest={false} toneMapped={false} />
          </sprite>
          <Billboard>
            <Text font={FONT_URL} fontSize={0.36} color={p.css.fg} anchorX="center" anchorY="middle" position={[0, 0, 0.32]} outlineWidth={0.012} outlineColor={`#${color.getHexString()}`}>
              {String(rank + 1)}
            </Text>
          </Billboard>
        </group>
      </Float>

      <Text font={FONT_URL} fontSize={0.135} color={p.css.fg} anchorX="center" anchorY="top" position={[0, -0.1, 0.62]} maxWidth={1.5} textAlign="center">
        {truncate(product.title || product.id || '', 18)}
      </Text>
      {product.category && (
        <Text font={FONT_URL} fontSize={0.095} color={p.css.fg3} anchorX="center" anchorY="top" position={[0, -0.3, 0.62]} maxWidth={1.5}>
          {truncate(String(product.category), 20)}
        </Text>
      )}

      {hovered && (
        <Html position={[0, height + 1.15, 0]} center zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-xl border border-line/10 bg-card/90 px-3 py-2 text-[11px] leading-tight text-fg shadow-card backdrop-blur-md">
            <div className="font-display text-xs font-semibold">{product.title}</div>
            <div className="mt-1 flex gap-3 tabular text-fg-2">
              <span><span className="text-fg-3">Revenue </span><span style={{ color: p.css.teal }}>{fmtMoney(product.revenue)}</span></span>
              <span><span className="text-fg-3">Units </span>{fmtNumber(product.units)}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function LookAt({ target }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => { camera.lookAt(target[0], target[1], target[2]); }, [camera, target]);
  return null;
}

function Floor({ p, isDark }) {
  const grid = useMemo(() => makeGridTexture(isDark ? p.css.primary : p.css.violet, { cells: 18 }), [p, isDark]);
  useEffect(() => () => grid.dispose(), [grid]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial map={grid} transparent opacity={isDark ? 0.3 : 0.4} depthWrite={false} toneMapped={false} />
      </mesh>
      <ContactShadows position={[0, -0.005, 0]} opacity={isDark ? 0.6 : 0.35} scale={9} blur={2.2} far={3} resolution={256} color={isDark ? '#05010f' : '#312e81'} />
    </group>
  );
}

function Scene({ products, p, isDark }) {
  const group = useRef(null);
  const [hovered, setHovered] = useState(null);
  useCursor(hovered != null);
  const glow = useMemo(getGlowTexture, []);
  const colors = useMemo(() => [p.primary, p.teal, p.violet], [p]);
  const rise = useMemo(() => makeProgress(3), []);
  const top = useMemo(() => [...products].filter(Boolean).sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 3), [products]);
  // stable signature — `products` is a new array identity on every parent render, so depending on
  // it directly re-ran the entrance effect forever and pinned the pillars at zero height
  const riseKey = top.map((t) => t?.id ?? '').join('|');
  const max = Math.max(1, ...top.map((t) => t.revenue || 0));

  useEffect(() => {
    if (prefersReducedMotion()) { setProgress(rise); return undefined; }
    setProgress(rise, 0);
    const tl = createTimeline();
    tl.add(rise, { v: [0, 1], duration: 1100, ease: 'outBack', delay: stagger(150, { from: 'center' }) }, 120);
    return () => tl.pause?.();
  }, [rise, riseKey]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(dt, 0.1);
    const sway = Math.sin(state.clock.elapsedTime * 0.45) * 0.17;
    g.rotation.y = damp(g.rotation.y, sway + state.pointer.x * 0.14, 3, d);
    g.rotation.x = damp(g.rotation.x, -state.pointer.y * 0.04, 3, d);
  });

  return (
    <>
      <LookAt target={[0, 0.95, 0]} />
      <ambientLight intensity={isDark ? 0.5 : 1} />
      <directionalLight position={[4, 7, 5]} intensity={isDark ? 1.6 : 2.2} />
      <pointLight position={[-4, 3, 3]} intensity={isDark ? 30 : 16} color={p.pink} distance={16} decay={2} />
      <pointLight position={[4, 2, -2]} intensity={isDark ? 26 : 14} color={p.teal} distance={16} decay={2} />
      <Environment key={isDark ? 'dark' : 'light'} resolution={64} frames={1} background={false} environmentIntensity={isDark ? 0.9 : 0.7}>
        <Lightformer form="rect" intensity={5} color={p.css.primary} position={[-5, 4, -3]} scale={[6, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={4} color={p.css.teal} position={[5, 3, 2]} scale={4} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} color={p.css.pink} position={[0, -3, 4]} scale={[6, 2, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={7} color="#ffffff" position={[0, 6, 0]} scale={3} target={[0, 0, 0]} />
      </Environment>
      <group ref={group}>
        {SLOT_X.map((x, slot) => {
          const rank = SLOT_RANK[slot];
          const product = top[rank];
          if (!product) return null;
          const h = 0.55 + 1.35 * ((product.revenue || 0) / max);
          return (
            <Pillar
              key={product.id ?? rank}
              product={product}
              rank={rank}
              x={x}
              height={h}
              color={colors[rank]}
              p={p}
              isDark={isDark}
              hovered={hovered === rank}
              setHovered={setHovered}
              glow={glow}
              progress={rise[rank]}
            />
          );
        })}
        <Floor p={p} isDark={isDark} />
      </group>
    </>
  );
}

export default function ProductPodium({ products = [], height = 300, className = '' }) {
  const { isDark } = useTheme();
  const p = usePalette();
  return (
    <SceneCanvas className={className} height={height} camera={{ fov: 36, position: [0, 2.3, 7], near: 0.1, far: 60 }} fallbackMessage="Top products">
      <Scene products={products} p={p} isDark={isDark} />
    </SceneCanvas>
  );
}
