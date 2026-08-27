/**
 * anime.js v4 helpers. All helpers respect prefers-reduced-motion (they finish instantly).
 * Import: `import { animate, stagger, createTimeline, createScope, utils, svg } from 'animejs'`.
 */
import { animate, stagger, createTimeline, createScope, utils, svg } from 'animejs';

export { animate, stagger, createTimeline, createScope, utils, svg };

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Count a number up in an element. `format` receives the current numeric value.
 * Returns the animation so callers can .pause()/.revert().
 */
export function countUp(el, to, { from = 0, duration = 1400, format = (v) => Math.round(v).toLocaleString(), delay = 0 } = {}) {
  if (!el) return null;
  if (prefersReducedMotion()) { el.textContent = format(to); return null; }
  const obj = { v: from };
  return animate(obj, {
    v: to,
    duration,
    delay,
    ease: 'outExpo',
    onUpdate: () => { el.textContent = format(obj.v); },
    onComplete: () => { el.textContent = format(to); },
  });
}

/** Staggered reveal for a list of elements (cards, rows). */
export function revealStagger(targets, { delay = 0, each = 70, y = 18, duration = 800, from = 'first' } = {}) {
  if (!targets || (targets.length !== undefined && targets.length === 0)) return null;
  if (prefersReducedMotion()) { utils.set(targets, { opacity: 1, translateY: 0 }); return null; }
  utils.set(targets, { opacity: 0, translateY: y });
  return animate(targets, {
    opacity: [0, 1],
    translateY: [y, 0],
    duration,
    delay: stagger(each, { start: delay, from }),
    ease: 'outExpo',
  });
}

/** Draw all SVG paths/lines in a container (logo, chart outlines). */
export function drawSvg(container, { duration = 1600, delay = 0, each = 120 } = {}) {
  if (!container) return null;
  const drawables = svg.createDrawable(container.querySelectorAll('path, line, polyline, circle'));
  if (prefersReducedMotion()) return null;
  return animate(drawables, { draw: ['0 0', '0 1'], duration, delay: stagger(each, { start: delay }), ease: 'inOutSine' });
}

/** Gentle attention pulse (used when a new live order arrives). */
export function pulse(el) {
  if (!el || prefersReducedMotion()) return null;
  return animate(el, { scale: [1, 1.04, 1], duration: 500, ease: 'inOutQuad' });
}
