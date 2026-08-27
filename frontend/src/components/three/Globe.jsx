/* eslint-disable react/no-unknown-property */
/**
 * Globe — dot-matrix earth with fresnel body, additive atmosphere, revenue-coloured city markers,
 * pulsing rings for the top-10 cities, animated flow arcs from the top city, hover tooltips,
 * click-to-select (the globe eases so the selected city faces the camera) and slow auto-rotation.
 *
 * Props: { points: [{ city, country, lat, lng, customers, revenue, orders }], height = 480,
 *          autoRotate = true, selected (city string | point | null), onSelect(point | null), className }
 *
 * Land dots are sampled at runtime from /textures/earth-water.png (bundled) using an offscreen canvas.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, QuadraticBezierLine, Stars, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme.jsx';
import { fmtMoney, fmtNumber } from '../../lib/format.js';
import { usePalette } from './palette.js';
import SceneCanvas from './SceneCanvas.jsx';
import { angleDelta, getGlowTexture, gradient3, latLngToVec3 } from './shared.js';

const TEXTURE_URL = '/textures/earth-water.png';
const DOT_TARGET = 15000;
const R = 1;
const Z_AXIS = new THREE.Vector3(0, 0, 1);

// Shared geometries — created once per module, never disposed (tiny).
const SPHERE_GEO = new THREE.SphereGeometry(1, 12, 12);
const RING_GEO = new THREE.RingGeometry(0.78, 1, 32);
const DIAMOND_GEO = new THREE.RingGeometry(0.86, 1, 4);

/* ------------------------------------------------------------------ land sampling */
const dotCache = new Map();

function fibonacciPoint(i, n, out) {
  const y = 1 - (2 * (i + 0.5)) / n;
  const r = Math.sqrt(1 - y * y);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  out[0] = r * Math.cos(a); out[1] = y; out[2] = r * Math.sin(a);
  return out;
}

function fallbackDots(n = 6000) {
  const out = new Float32Array(n * 3);
  const v = [0, 0, 0];
  for (let i = 0; i < n; i++) { fibonacciPoint(i, n, v); out.set(v, i * 3); }
  return out;
}

/** Sample `target` dots on land by testing a Fibonacci sphere against the equirectangular mask. */
function sampleLand(img, target) {
  const W = 1024, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;
  const isDark = (x, y) => data[(y * W + x) * 4] < 128;

  // Land is ~29% of the surface → whichever class is the (latitude-weighted) minority is land.
  let dark = 0, total = 0;
  for (let y = 0; y < H; y += 4) {
    const w = Math.sin(((y + 0.5) / H) * Math.PI);
    for (let x = 0; x < W; x += 4) { total += w; if (isDark(x, y)) dark += w; }
  }
  const darkFrac = dark / total;
  const landIsDark = darkFrac < 0.5;
  const landFrac = landIsDark ? darkFrac : 1 - darkFrac;
  const N = Math.round(target / Math.max(landFrac, 0.05));

  const out = [];
  const v = [0, 0, 0];
  for (let i = 0; i < N; i++) {
    fibonacciPoint(i, N, v);
    const [x, y, z] = v;
    // inverse of latLngToVec3: x = -sinφ cosθ, z = sinφ sinθ, y = cosφ
    const lat = 90 - (Math.acos(Math.max(-1, Math.min(1, y))) * 180) / Math.PI;
    let theta = Math.atan2(z, -x);
    if (theta < 0) theta += Math.PI * 2;
    const lng = (theta * 180) / Math.PI - 180;
    const px = Math.min(W - 1, Math.max(0, Math.floor(((lng + 180) / 360) * W)));
    const py = Math.min(H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * H)));
    if (isDark(px, py) === landIsDark) out.push(x, y, z);
  }
  return new Float32Array(out);
}

function useLandDots(url, target) {
  const [dots, setDots] = useState(() => dotCache.get(url) || null);
  useEffect(() => {
    if (dotCache.has(url)) { setDots(dotCache.get(url)); return undefined; }
    let alive = true;
    const img = new Image();
    const finish = (res) => { dotCache.set(url, res); if (alive) setDots(res); };
    img.onload = () => {
      let res;
      try { res = sampleLand(img, target); } catch { res = fallbackDots(); }
      if (!res.length) res = fallbackDots();
      finish(res);
    };
    img.onerror = () => finish(fallbackDots());
    img.src = url;
    return () => { alive = false; };
  }, [url, target]);
  return dots;
}

/* ------------------------------------------------------------------ shaders */
const VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const BODY_FRAG = /* glsl */ `
  uniform vec3 uBase; uniform vec3 uRim; uniform vec3 uRim2; uniform float uRimStrength;
  varying vec3 vNormal; varying vec3 vView;
  void main() {
    float ndv = max(dot(vNormal, vView), 0.0);
    float fres = pow(1.0 - ndv, 3.2);
    vec3 light = normalize(vec3(-0.45, 0.75, 0.8));
    float diff = 0.6 + 0.4 * max(dot(vNormal, light), 0.0);
    vec3 rim = mix(uRim2, uRim, clamp(vNormal.y * 0.5 + 0.5, 0.0, 1.0));
    vec3 col = uBase * diff + rim * fres * uRimStrength;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform vec3 uColor2; uniform float uIntensity; uniform float uPower;
  varying vec3 vNormal; varying vec3 vView;
  void main() {
    float d = clamp(-dot(vNormal, vView) * 1.9, 0.0, 1.0);
    float a = pow(d, uPower) * uIntensity;
    vec3 col = mix(uColor2, uColor, clamp(vNormal.y * 0.5 + 0.5, 0.0, 1.0));
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ------------------------------------------------------------------ earth */
function Earth({ p, isDark, dots }) {
  const bodyMat = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        // Light theme needs a deeper body or the indigo land dots wash out against a near-white sphere.
        uBase: { value: isDark ? p.card.clone().lerp(p.primary, 0.12) : p.panel.clone().lerp(p.primary, 0.42) },
        uRim: { value: p.primary.clone() },
        uRim2: { value: p.teal.clone() },
        uRimStrength: { value: isDark ? 1.5 : 1.1 },
      },
      vertexShader: VERT,
      fragmentShader: BODY_FRAG,
    }),
    [p, isDark],
  );
  const atmoMat = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: p.primary.clone() },
        uColor2: { value: p.teal.clone() },
        uIntensity: { value: isDark ? 0.8 : 0.6 },
        uPower: { value: 2.6 }, // higher power = tighter rim, so the halo reads as atmosphere not fog
      },
      vertexShader: VERT,
      fragmentShader: ATMO_FRAG,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    }),
    [p, isDark],
  );
  useEffect(() => () => { bodyMat.dispose(); atmoMat.dispose(); }, [bodyMat, atmoMat]);

  const dotGeo = useMemo(() => {
    if (!dots) return null;
    const n = dots.length / 3;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    const a = isDark ? p.teal : p.primary;
    const b = isDark ? p.primary : p.violet;
    for (let i = 0; i < n; i++) {
      const y = dots[i * 3 + 1];
      const t = Math.min(1, Math.max(0, y * 0.5 + 0.5 + (Math.random() - 0.5) * 0.25));
      c.copy(a).lerp(b, t);
      if (!isDark) c.multiplyScalar(0.85 + Math.random() * 0.15);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(dots, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [dots, p, isDark]);
  useEffect(() => () => dotGeo?.dispose(), [dotGeo]);

  const dotMat = useRef(null);
  useFrame((_, dt) => {
    const m = dotMat.current;
    if (m && m.opacity < 0.95) m.opacity = Math.min(0.95, m.opacity + dt * 0.9);
  });

  return (
    <>
      <mesh material={bodyMat} onPointerOver={(e) => e.stopPropagation()}>
        <sphereGeometry args={[R * 0.985, 64, 64]} />
      </mesh>
      <mesh material={atmoMat} scale={1.13}>
        <sphereGeometry args={[R, 48, 48]} />
      </mesh>
      {dotGeo && (
        <points geometry={dotGeo}>
          <pointsMaterial
            ref={dotMat}
            size={isDark ? 0.018 : 0.02}
            sizeAttenuation
            vertexColors
            transparent
            opacity={0}
            depthWrite={false}
            blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
            toneMapped={false}
          />
        </points>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ markers */
function Tooltip({ point, p, compact = false }) {
  return (
    <div className="pointer-events-none select-none whitespace-nowrap rounded-xl border border-line/10 bg-card/90 px-3 py-2 text-left text-[11px] leading-tight text-fg shadow-card backdrop-blur-md">
      <div className="font-display text-xs font-semibold">
        {point.city}
        {point.country ? <span className="ml-1 font-sans font-normal text-fg-3">{point.country}</span> : null}
      </div>
      {!compact && (
        <div className="mt-1 flex gap-3 tabular text-fg-2">
          <span><span className="text-fg-3">Customers </span>{fmtNumber(point.customers)}</span>
          <span><span className="text-fg-3">Revenue </span><span style={{ color: p.css.teal }}>{fmtMoney(point.revenue)}</span></span>
          {point.orders != null && <span><span className="text-fg-3">Orders </span>{fmtNumber(point.orders)}</span>}
        </div>
      )}
    </div>
  );
}

function Marker({ entry, p, isDark, glow, hovered, selected, onHover, onClick, showLabel }) {
  const { point, pos, quat, size, color, pulse, phase } = entry;
  const ring = useRef(null);
  const sel = useRef(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring.current) {
      const ph = (t * 0.7 + phase) % 1;
      ring.current.scale.setScalar(size * (1.6 + ph * 5.5));
      ring.current.material.opacity = (1 - ph) * 0.9;
    }
    if (sel.current) {
      sel.current.rotation.z = t * 1.2;
      sel.current.scale.setScalar(size * 4.6 + Math.sin(t * 5) * size * 0.5);
    }
  });

  const active = hovered || selected;
  return (
    <group position={pos} quaternion={quat}>
      <mesh geometry={SPHERE_GEO} scale={active ? size * 1.35 : size} dispose={null}>
        <meshBasicMaterial color={active ? p.fg : color} toneMapped={false} />
      </mesh>
      <sprite scale={[size * 10, size * 10, 1]} position-z={0.002}>
        <spriteMaterial map={glow} color={active ? p.pink : color} transparent opacity={isDark ? 0.95 : 0.55} blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      {pulse && (
        <mesh ref={ring} geometry={RING_GEO} position-z={0.003} dispose={null}>
          <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {selected && (
        <mesh ref={sel} geometry={DIAMOND_GEO} position-z={0.004} dispose={null}>
          <meshBasicMaterial color={p.pink} transparent opacity={0.95} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {/* generous invisible hit target */}
      <mesh
        geometry={SPHERE_GEO}
        scale={Math.max(size * 2.6, 0.03)}
        dispose={null}
        onPointerOver={(e) => { e.stopPropagation(); onHover(point); }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onClick(point); }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {(hovered || showLabel) && (
        <Html position={[0, size * 4, 0.02]} center zIndexRange={[50, 0]} style={{ transform: 'translateY(-70%)' }}>
          <Tooltip point={point} p={p} compact={!hovered} />
        </Html>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ arcs */
function Arc({ from, to, color, glow, isDark, phase, speed = 1 }) {
  const line = useRef(null);
  const packet = useRef(null);
  const { mid, curve } = useMemo(() => {
    const m = from.clone().add(to).multiplyScalar(0.5);
    const dist = from.distanceTo(to);
    m.normalize().multiplyScalar(R + 0.06 + dist * 0.32);
    return { mid: m, curve: new THREE.QuadraticBezierCurve3(from, m, to) };
  }, [from, to]);

  useFrame((state, dt) => {
    if (line.current?.material) line.current.material.dashOffset -= dt * 0.9 * speed;
    if (packet.current) {
      const t = (state.clock.elapsedTime * 0.16 * speed + phase) % 1;
      curve.getPoint(t, packet.current.position);
      const s = 0.035 + Math.sin(t * Math.PI) * 0.03;
      packet.current.scale.set(s, s, 1);
    }
  });

  return (
    <>
      <QuadraticBezierLine
        ref={line}
        start={from}
        end={to}
        mid={mid}
        segments={32}
        color={color}
        lineWidth={1.2}
        dashed
        dashScale={10}
        dashSize={0.55}
        gapSize={0.35}
        transparent
        opacity={isDark ? 0.8 : 0.9}
        depthWrite={false}
        toneMapped={false}
      />
      <sprite ref={packet} scale={[0.05, 0.05, 1]}>
        <spriteMaterial map={glow} color={isDark ? p_white : color} transparent opacity={0.95} blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </>
  );
}
const p_white = new THREE.Color('#ffffff');

/* ------------------------------------------------------------------ rotation / focus */
function Rotator({ focus, children }) {
  const group = useRef(null);
  const camera = useThree((s) => s.camera);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g || !focus) return;
    const camAz = Math.atan2(camera.position.x, camera.position.z);
    const ptAz = Math.atan2(focus.x, focus.z);
    const d = angleDelta(g.rotation.y, camAz - ptAz);
    g.rotation.y += d * Math.min(1, dt * 3.2);
  });
  return <group ref={group}>{children}</group>;
}

function GlobeScene({ points, p, isDark, dots, autoRotate, selectedCity, onSelect }) {
  const glow = useMemo(getGlowTexture, []);
  const [hovered, setHovered] = useState(null);
  useCursor(!!hovered);

  const entries = useMemo(() => {
    const valid = points.filter((pt) => Number.isFinite(pt?.lat) && Number.isFinite(pt?.lng));
    const byRevenue = [...valid].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    const rank = new Map(byRevenue.map((pt, i) => [pt, i]));
    const byCustomers = [...valid].sort((a, b) => (b.customers || 0) - (a.customers || 0));
    const top10 = new Set(byCustomers.slice(0, 10));
    const n = Math.max(1, valid.length - 1);
    return valid.map((pt, i) => {
      const pos = latLngToVec3(pt.lat, pt.lng, R + 0.004);
      const quat = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, pos.clone().normalize());
      const t = 1 - rank.get(pt) / n; // 1 = highest revenue
      return {
        point: pt,
        pos,
        quat,
        size: 0.008 + 0.0042 * Math.log((pt.customers || 0) + 1),
        color: gradient3(t, p.teal, p.primary, p.pink),
        pulse: top10.has(pt),
        phase: (i * 0.37) % 1,
        rank: rank.get(pt),
      };
    });
  }, [points, p]);

  const arcs = useMemo(() => {
    if (entries.length < 2) return [];
    const sorted = [...entries].sort((a, b) => a.rank - b.rank);
    const hub = sorted[0];
    return sorted.slice(1, 13).map((e, i) => ({ key: e.point.city + i, from: hub.pos, to: e.pos, color: e.color, phase: (i * 0.29) % 1, speed: 0.8 + (i % 3) * 0.25 }));
  }, [entries]);

  const selectedEntry = useMemo(
    () => (selectedCity ? entries.find((e) => e.point.city === selectedCity) || null : null),
    [entries, selectedCity],
  );

  return (
    <>
      {isDark && <Stars radius={30} depth={25} count={1400} factor={2.6} saturation={0.5} fade speed={0.3} />}
      <Rotator focus={selectedEntry?.pos || null}>
        <Earth p={p} isDark={isDark} dots={dots} />
        {arcs.map((a) => (
          <Arc key={a.key} from={a.from} to={a.to} color={`#${a.color.getHexString()}`} glow={glow} isDark={isDark} phase={a.phase} speed={a.speed} />
        ))}
        {entries.map((e) => (
          <Marker
            key={`${e.point.city}-${e.point.lat}-${e.point.lng}`}
            entry={e}
            p={p}
            isDark={isDark}
            glow={glow}
            hovered={hovered === e.point}
            selected={selectedEntry === e}
            showLabel={selectedEntry === e && !hovered}
            onHover={setHovered}
            onClick={(pt) => onSelect?.(pt)}
          />
        ))}
      </Rotator>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        autoRotate={autoRotate && !selectedEntry && !hovered}
        autoRotateSpeed={0.55}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
      />
    </>
  );
}

export default function Globe({ points = [], height = 480, autoRotate = true, selected = null, onSelect, className = '' }) {
  const { isDark } = useTheme();
  const p = usePalette();
  const dots = useLandDots(TEXTURE_URL, DOT_TARGET);
  const selectedCity = typeof selected === 'string' ? selected : selected?.city ?? null;

  const overlay = !dots ? (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="flex items-center gap-2 rounded-full border border-line/10 bg-card/80 px-3 py-1.5 text-xs text-fg-2 backdrop-blur-md">
        <span className="live-dot" /> Sampling terrain…
      </div>
    </div>
  ) : null;

  return (
    <SceneCanvas
      className={className}
      height={height}
      camera={{ fov: 36, position: [0, 0.6, 4.4], near: 0.1, far: 60 }}
      overlay={overlay}
      onPointerMissed={() => onSelect?.(null)}
      fallbackMessage="Order globe"
    >
      <GlobeScene points={points} p={p} isDark={isDark} dots={dots} autoRotate={autoRotate} selectedCity={selectedCity} onSelect={onSelect} />
    </SceneCanvas>
  );
}
