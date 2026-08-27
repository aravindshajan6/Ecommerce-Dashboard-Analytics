/* eslint-disable react/no-unknown-property */
/**
 * DataCore — a small floating "data core" for cards: wireframe icosahedron shell, a glowing
 * distorted inner sphere, two tilted orbit rings with beads and a few sparkles. Transparent background.
 * Props: { size = 160, className }
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme.jsx';
import { usePalette } from './palette.js';
import SceneCanvas from './SceneCanvas.jsx';
import { getGlowTexture } from './shared.js';

function Ring({ radius, tube, color, rotation, speed, beads = 3, p }) {
  const ref = useRef(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.z += dt * speed; });
  const beadPositions = useMemo(
    () => Array.from({ length: beads }, (_, i) => {
      const a = (i / beads) * Math.PI * 2;
      return [Math.cos(a) * radius, Math.sin(a) * radius, 0];
    }),
    [beads, radius],
  );
  return (
    <group ref={ref} rotation={rotation}>
      <mesh>
        <torusGeometry args={[radius, tube, 8, 128]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.85} />
      </mesh>
      {beadPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={i === 0 ? p.fg : color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Core({ p, isDark }) {
  const group = useRef(null);
  const glow = useMemo(getGlowTexture, []);
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.25;
  });
  return (
    <Float speed={1.6} rotationIntensity={0.5} floatIntensity={0.9}>
      <group ref={group}>
        <sprite scale={[3, 3, 1]}>
          <spriteMaterial map={glow} color={p.teal} transparent opacity={isDark ? 0.55 : 0.3} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
        </sprite>
        <mesh>
          <sphereGeometry args={[0.58, 48, 48]} />
          <MeshDistortMaterial color={p.primary} emissive={p.violet} emissiveIntensity={isDark ? 0.6 : 0.35} roughness={0.25} metalness={0.2} distort={0.45} speed={2.2} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.18, 1]} />
          <meshPhysicalMaterial color={p.primary} transparent opacity={0.07} roughness={0.2} depthWrite={false} />
          <Edges threshold={10} color={p.css.primary} lineWidth={1} />
        </mesh>
        <Ring radius={1.55} tube={0.012} color={p.pink} rotation={[1.15, 0.2, 0]} speed={0.45} p={p} />
        <Ring radius={1.82} tube={0.008} color={p.teal} rotation={[-0.8, 0.55, 0.3]} speed={-0.3} beads={2} p={p} />
        <Sparkles count={26} scale={3.8} size={2.4} speed={0.4} color={p.teal} opacity={0.9} />
      </group>
    </Float>
  );
}

export default function DataCore({ size = 160, className = '' }) {
  const { isDark } = useTheme();
  const p = usePalette();
  return (
    <SceneCanvas
      width={size}
      height={size}
      rounded="rounded-full"
      className={className}
      camera={{ fov: 40, position: [0, 0, 5.4], near: 0.1, far: 40 }}
      fallbackVariant="gradient"
    >
      <ambientLight intensity={isDark ? 0.6 : 1} />
      <pointLight position={[3, 3, 3]} intensity={26} color={p.teal} />
      <pointLight position={[-3, -2, 2]} intensity={22} color={p.pink} />
      <Core p={p} isDark={isDark} />
    </SceneCanvas>
  );
}
