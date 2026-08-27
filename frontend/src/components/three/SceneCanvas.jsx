import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTheme } from '../../lib/theme.jsx';
import { DPR, GL } from './shared.js';
import { hasWebGL } from './webgl.js';
import { useActive, useSeen } from './useInView.js';
import ThreeErrorBoundary from './ThreeErrorBoundary.jsx';
import StaticFallback from './StaticFallback.jsx';

/**
 * The one Canvas wrapper every component uses:
 *  - dpr [1, 1.5], antialias + alpha + high-performance GL
 *  - reduced-motion / no-WebGL → static gradient fallback
 *  - IntersectionObserver + page visibility → frameloop 'always' | 'never'
 *  - ThreeErrorBoundary around the Canvas
 * `overlay` renders DOM on top of the canvas (loading states, legends).
 */
export default function SceneCanvas({
  children, className = '', style, height, width, camera, rounded = 'rounded-2xl',
  fallbackMessage, fallbackVariant = 'gradient', overlay, containerRef, frameloop, ...canvasProps
}) {
  const localRef = useRef(null);
  const ref = containerRef || localRef;
  const active = useActive(ref);
  const seen = useSeen(ref);
  const { reducedMotion } = useTheme();
  const [webgl] = useState(hasWebGL);

  if (reducedMotion || !webgl) {
    return (
      <StaticFallback
        variant={fallbackVariant}
        height={height}
        width={width}
        className={className}
        rounded={rounded}
        style={style}
        message={fallbackMessage ?? (!webgl ? '3D view unavailable' : undefined)}
      />
    );
  }

  // 'demand' (not 'never') when off-screen: r3f still paints once on mount/prop change, so the scene is
  // already correct when it scrolls in — 'never' leaves the canvas blank until something forces a redraw.
  // Mount the Canvas only once the container has been seen: r3f never starts its render loop for a
  // Canvas that mounts off-screen, which left scenes blank. Once mounted, drop to 'demand' when the
  // scene scrolls away so it keeps its last frame without burning CPU.
  const loop = frameloop ?? (active ? 'always' : 'demand');
  return (
    <div ref={ref} className={`relative overflow-hidden ${rounded} ${className}`} style={{ height, width, ...style }}>
      <ThreeErrorBoundary height="100%" rounded={rounded}>
        {seen && (
          <Canvas dpr={DPR} gl={GL} camera={camera} frameloop={loop} style={{ position: 'absolute', inset: 0 }} {...canvasProps}>
            {/* r3f v9's Canvas has no built-in Suspense boundary: drei's Text/useTexture suspend,
                which would otherwise blank the whole scene. */}
            <Suspense fallback={null}>{children}</Suspense>
          </Canvas>
        )}
      </ThreeErrorBoundary>
      {overlay}
    </div>
  );
}
