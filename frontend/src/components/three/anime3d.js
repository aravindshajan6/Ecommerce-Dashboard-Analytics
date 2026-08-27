/**
 * Bridge between anime.js and react-three-fiber.
 *
 * anime.js cannot write into an instanced matrix or a THREE.Object3D transform directly, but it can
 * animate any plain JS object — so the split is:
 *   · anime.js owns the CHOREOGRAPHY (timelines, staggers, easings) over arrays of `{ v }` proxies
 *   · useFrame owns the RENDER, reading those values each frame and applying them to three.js
 * That gives 3D scenes the same stagger/grid/easing vocabulary the DOM animations use.
 */
import { createTimeline, stagger, utils } from 'animejs';

export { createTimeline, stagger, utils };

/** `n` progress proxies for anime.js to stagger over and useFrame to read. */
export const makeProgress = (n) => Array.from({ length: n }, () => ({ v: 0 }));

/** Snap every proxy to a value (used for the reduced-motion path). */
export const setProgress = (proxies, v = 1) => proxies.forEach((o) => { o.v = v; });
