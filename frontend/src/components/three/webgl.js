let cached = null;

/** Cheap, cached WebGL capability probe. Never throws. */
export function hasWebGL() {
  if (cached !== null) return cached;
  try {
    if (typeof document === 'undefined') return (cached = false);
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    cached = !!gl;
    const lose = gl?.getExtension?.('WEBGL_lose_context');
    lose?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
