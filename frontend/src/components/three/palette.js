/**
 * usePalette() — reads the CSS design tokens ("99 102 241" RGB triplets) from :root at runtime and
 * returns THREE.Color instances, re-reading whenever the theme flips.
 */
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme.jsx';

const TOKENS = {
  primary: 'primary', teal: 'teal', pink: 'pink', violet: 'violet',
  bg: 'bg', panel: 'panel', card: 'card', fg: 'fg', fg2: 'fg-2', fg3: 'fg-3', line: 'line',
};
const FALLBACK = {
  primary: '#6366f1', teal: '#2dd4bf', pink: '#ec4899', violet: '#8b5cf6',
  bg: '#05010f', panel: '#0b0a1a', card: '#110f24', fg: '#f4f2ff', fg2: '#a9a6c4', fg3: '#6b6889', line: '#ffffff',
};

/** Parse a single token (`--primary`) into a THREE.Color (sRGB → linear handled by three). */
export function readToken(name, fallback = '#ffffff') {
  if (typeof document === 'undefined') return new THREE.Color(fallback);
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  const parts = raw.split(/[\s,/]+/).filter(Boolean).slice(0, 3);
  if (parts.length === 3 && parts.every((p) => /^\d+(\.\d+)?$/.test(p))) {
    return new THREE.Color(`rgb(${parts.join(',')})`);
  }
  return new THREE.Color(fallback);
}

export function readPalette() {
  const p = { css: {} };
  for (const key of Object.keys(TOKENS)) {
    const c = readToken(TOKENS[key], FALLBACK[key]);
    p[key] = c;
    p.css[key] = `#${c.getHexString()}`;
  }
  p.isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return p;
}

/**
 * Returns { primary, teal, pink, violet, bg, panel, card, fg, fg2, fg3, line } as THREE.Color plus
 * `css` (hex strings for DOM/Text usage) and `isDark`.
 */
export function usePalette() {
  const { isDark } = useTheme();
  const [palette, setPalette] = useState(readPalette);
  useEffect(() => {
    // ThemeProvider toggles `html.dark` in its own effect (which runs after ours) — read on the next frame.
    const id = requestAnimationFrame(() => setPalette(readPalette()));
    return () => cancelAnimationFrame(id);
  }, [isDark]);
  return palette;
}
