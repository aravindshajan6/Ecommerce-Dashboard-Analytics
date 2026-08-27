/**
 * AuroraParticles — fixed, full-viewport, pointer-events-none particle field behind the dashboard
 * (z-index -1, above the CSS `.aurora` gradient at -2). ~140 drei Sparkles in palette colours plus a
 * sparse star field that drifts with the pointer. Rendered on demand at ≤30fps; nothing is rendered
 * under reduced motion, without WebGL, or while the tab is hidden.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Stars } from '@react-three/drei';
import { useTheme } from '../../lib/theme.jsx';
import { usePalette } from './palette.js';
import { usePageVisible, useWindowPointer } from './useInView.js';
import { hasWebGL } from './webgl.js';
import { DPR, GL, damp } from './shared.js';
import ThreeErrorBoundary from './ThreeErrorBoundary.jsx';

const FPS = 30;
const COUNT = 140;

/** frameloop="demand" + a 30fps invalidate() ticker keeps CPU/GPU use low for a purely decorative layer. */
function FrameGate() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const id = setInterval(() => invalidate(), 1000 / FPS);
    return () => clearInterval(id);
  }, [invalidate]);
  return null;
}

function Field({ palette, isDark, pointer }) {
  const group = useRef(null);
  const { colors, sizes, speeds } = useMemo(() => {
    const swatches = [palette.primary, palette.teal, palette.pink, palette.violet, palette.primary, palette.teal];
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const c = swatches[i % swatches.length];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      sizes[i] = 0.8 + Math.random() * 2.4;
      speeds[i] = 0.15 + Math.random() * 0.35;
    }
    return { colors, sizes, speeds };
  }, [palette]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(dt, 0.1);
    g.rotation.y = damp(g.rotation.y, pointer.current.x * 0.12, 1.6, d);
    g.rotation.x = damp(g.rotation.x, -pointer.current.y * 0.08, 1.6, d);
    g.position.x = damp(g.position.x, pointer.current.x * 0.5, 1.6, d);
    g.position.y = damp(g.position.y, pointer.current.y * 0.3, 1.6, d);
  });

  return (
    <group ref={group}>
      <Sparkles count={COUNT} size={sizes} speed={speeds} opacity={isDark ? 0.85 : 0.7} color={colors} scale={[24, 14, 8]} noise={0.6} />
      {isDark && <Stars radius={40} depth={30} count={900} factor={2.2} saturation={0.5} fade speed={0.35} />}
    </group>
  );
}

export default function AuroraParticles({ className = '' }) {
  const { reducedMotion, isDark } = useTheme();
  const palette = usePalette();
  const visible = usePageVisible();
  const [webgl] = useState(hasWebGL);
  const enabled = !reducedMotion && webgl;
  const pointer = useWindowPointer(enabled);

  if (!enabled) return null;

  return (
    <div className={`pointer-events-none fixed inset-0 ${className}`} style={{ zIndex: -1 }} aria-hidden="true">
      <ThreeErrorBoundary fallback={null}>
        <Canvas
          dpr={DPR}
          gl={GL}
          camera={{ fov: 55, position: [0, 0, 9], near: 0.1, far: 120 }}
          frameloop={visible ? 'demand' : 'never'}
          style={{ pointerEvents: 'none' }}
        >
          <FrameGate />
          <Field palette={palette} isDark={isDark} pointer={pointer} />
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
}
