# Verified API notes (anime.js 4.5, r3f 9.7, drei 10.7, three 0.185, recharts 3.10, react-query 5)

## anime.js v4
import { animate, stagger, createTimeline, createScope, utils, svg, onScroll, spring } from 'animejs'
- animate(targets, { x, y, scale, rotate, opacity, duration, delay, ease: 'outExpo' | 'inOutQuad' | 'outBack' | 'outElastic(1, .3)' | spring({bounce:.5}), loop: true|n, alternate: true, autoplay, onUpdate, onComplete }). Property `ease` NOT `easing`.
- JS object counters: const o={v:0}; animate(o,{ v: 1234, modifier: utils.round(0), onUpdate: () => el.textContent = o.v })
- stagger(100, { start: 200, from: 'center'|'first'|'last'|index, grid:[cols,rows], axis:'x' })
- createTimeline({ defaults:{ duration: 750 } }).add(targets, params, position) — positions: 500, '+=100', '-=100', '<' (end of prev), '<<' (start of prev), '<<+=250', 'label'
- svg.createDrawable('.line') then animate(drawables, { draw: ['0 0','0 1'], ease:'inOutQuad' })
- React: const scope=createScope({ root: ref }).add(self => { animate('.x', {...}) }); cleanup: scope.revert()
- onScroll({ container, target, enter:'bottom top', leave:'top bottom', sync: true }) as `autoplay`
- utils.$, utils.set(targets,{...}), utils.remove, utils.random(min,max), utils.clamp(min,max), utils.mapRange

## r3f 9 + drei 10 (React 19)
- <Canvas dpr={[1, 1.5]} camera={{ fov: 45, position: [0,0,6] }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} frameloop="always"|"demand">
- useFrame((state, delta) => {}), useThree(s => s.camera)
- drei: Float(speed, rotationIntensity, floatIntensity), Stars(radius, depth, count, factor, fade, speed), Sparkles(count, speed, opacity, color, size, scale, noise), OrbitControls(autoRotate, autoRotateSpeed, enableZoom, enablePan, minPolarAngle, maxPolarAngle, enableDamping), MeshDistortMaterial(distort, speed), MeshWobbleMaterial(factor, speed), MeshTransmissionMaterial(transmission, thickness, roughness, chromaticAberration, samples, resolution) [expensive], Html(center, distanceFactor, transform, occlude), Text(color, fontSize, anchorX, anchorY), Line(points, color, lineWidth, dashed), Points/PointMaterial, Instances/Instance, RoundedBox(args, radius, smoothness), Edges, ContactShadows, Center, Preload, AdaptiveDpr, PerformanceMonitor.
- AVOID `Environment preset="..."` (loads HDR from a CDN — not reliable in prod). Use lights: ambientLight + directionalLight + pointLight, and emissive/physical materials.
- three addons: import from 'three/addons/...' (or 'three/examples/jsm/...').
- Dispose on unmount is automatic in r3f. Wrap heavy scenes in React.lazy + Suspense; keep Canvas containers with explicit height.

## recharts 3
- Same JSX API as v2; ResponsiveContainer still fine; custom Tooltip via content={<X/>} receiving {active, payload, label}; gradients via <defs><linearGradient>. `Cell` still works (deprecated in 3.7, ok). Install react-is (done).

## react-query 5
- useQuery({ queryKey, queryFn }); flags: isPending (initial), isFetching, isError, error, data, refetch.
