import { useEffect, useRef } from 'react';
import { createScope } from 'animejs';
import { countUp, revealStagger } from '../lib/motion.js';

/**
 * Runs `fn(scope, root)` inside an anime.js scope bound to a root element and reverts on unmount.
 * Re-runs when `deps` change (handy when data arrives).
 */
export function useAnimeScope(fn, deps = []) {
  const root = useRef(null);
  useEffect(() => {
    if (!root.current) return undefined;
    const scope = createScope({ root: root.current }).add((self) => fn(self, root.current));
    return () => scope.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return root;
}

/** Animate a numeric value into the returned ref's element whenever `value` changes. */
export function useCountUp(value, options = {}) {
  const ref = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    if (value == null || !ref.current) return undefined;
    const anim = countUp(ref.current, value, { from: prev.current, ...options });
    prev.current = value;
    return () => anim?.pause?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return ref;
}

/** Stagger-reveal the direct children (or `selector` matches) of the returned ref once `ready` is true. */
export function useReveal(ready = true, { selector = ':scope > *', ...opts } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ready || !ref.current) return undefined;
    const targets = ref.current.querySelectorAll(selector);
    const anim = revealStagger(targets, opts);
    return () => anim?.pause?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return ref;
}
