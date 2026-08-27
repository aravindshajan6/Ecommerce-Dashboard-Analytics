import { useEffect, useRef, useState } from 'react';

/** True while the document tab is visible. */
export function usePageVisible() {
  const [visible, setVisible] = useState(() => (typeof document === 'undefined' ? true : !document.hidden));
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

/** True while `ref.current` intersects the viewport (with a little margin so scenes warm up before scrolling in). */
export default function useInView(ref, { rootMargin = '160px', threshold = 0 } = {}) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin, threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold]);
  return inView;
}

/**
 * Latches true the first time `ref.current` enters the viewport and stays true.
 * A react-three-fiber Canvas that mounts while off-screen never starts its loop, so scenes are
 * mounted lazily on first sight instead of being mounted hidden and woken up later.
 */
export function useSeen(ref, { rootMargin = '200px', threshold = 0 } = {}) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return undefined; }
    // Already on screen at mount (rect intersects the viewport) → don't wait for the observer.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight + 200 && r.bottom > -200) { setSeen(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin, threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen, rootMargin, threshold]);
  return seen;
}

/** Combined "should this canvas be rendering right now" flag → maps to frameloop 'always' | 'demand'. */
export function useActive(ref, opts) {
  const inView = useInView(ref, opts);
  const visible = usePageVisible();
  return inView && visible;
}

/** Normalised (-1..1) window pointer, stored in a ref so reading it in useFrame never re-renders. */
export function useWindowPointer(enabled = true) {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!enabled) return undefined;
    const onMove = (e) => {
      ref.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled]);
  return ref;
}
