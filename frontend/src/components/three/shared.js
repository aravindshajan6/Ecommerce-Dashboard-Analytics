/**
 * Shared constants and tiny helpers for the three/ components.
 * Everything here is framework-agnostic (no hooks) so it can be used inside useMemo/useFrame.
 */
import * as THREE from 'three';

/** Canvas props required by the design brief (docs/DESIGN.md → Motion rules). */
export const DPR = [1, 1.5];
export const GL = { antialias: true, alpha: true, powerPreference: 'high-performance' };

/** Bundled font for drei <Text> so troika never reaches for its CDN fallback. */
export const FONT_URL = '/fonts/SpaceGrotesk.ttf';

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Exponential smoothing that is frame-rate independent. */
export const damp = (current, target, lambda, dt) => THREE.MathUtils.damp(current, target, lambda, dt);

/** Smallest signed angle from `a` to `b` (radians). */
export function angleDelta(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Three-stop gradient (t ∈ [0,1]) → out colour. */
export function gradient3(t, a, b, c, out = new THREE.Color()) {
  const x = clamp01(t);
  if (x < 0.5) out.copy(a).lerp(b, x * 2);
  else out.copy(b).lerp(c, (x - 0.5) * 2);
  return out;
}

/** lat/lng → unit-sphere position (matches the equirectangular mapping used by the land mask). */
export function latLngToVec3(lat, lng, r = 1, out = new THREE.Vector3()) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return out.set(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

let glowTexture = null;
/** Soft radial sprite used for additive "bloom-like" halos. Created once, shared by every scene. */
export function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}

/**
 * A grid drawn into a canvas with a radial alpha fade — cheaper and prettier than GridHelper + fog
 * on a transparent canvas. `color` is a CSS colour string.
 */
export function makeGridTexture(color, { size = 1024, cells = 24, alpha = 0.9 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2;
  const step = size / cells;
  ctx.beginPath();
  for (let i = 0; i <= cells; i++) {
    const p = Math.round(i * step) + 0.5;
    ctx.moveTo(p, 0); ctx.lineTo(p, size);
    ctx.moveTo(0, p); ctx.lineTo(size, p);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.6)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Truncate a label for 3D text. */
export const truncate = (s = '', n = 18) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
