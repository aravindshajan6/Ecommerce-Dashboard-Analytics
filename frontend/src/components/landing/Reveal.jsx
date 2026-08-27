import { useEffect, useRef } from 'react';
import { utils } from 'animejs';
import { prefersReducedMotion, revealStagger } from '../../lib/motion.js';

/**
 * Reveals matching children (default: direct children) with a stagger the first time the wrapper
 * scrolls into view. IntersectionObserver + anime.js `revealStagger`; the animation is paused on unmount.
 */
export default function Reveal({ as: Tag = 'div', selector = ':scope > *', each = 80, y = 24, duration = 900, threshold = 0.15, className, children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll(selector);
    if (!targets.length) return undefined;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      utils.set(targets, { opacity: 1, translateY: 0 });
      return undefined;
    }
    utils.set(targets, { opacity: 0, translateY: y });
    let anim = null;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      anim = revealStagger(targets, { each, y, duration });
    }, { threshold, rootMargin: '0px 0px -8% 0px' });
    io.observe(root);
    return () => { io.disconnect(); anim?.pause?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
