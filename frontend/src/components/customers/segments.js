import { C } from '../charts/theme.js';

/** Canonical RFM segment order (matches docs/API.md). */
export const SEGMENT_ORDER = [
  'Champions', 'Loyal', 'Potential Loyalist', 'New', 'Promising',
  'Need Attention', 'About To Sleep', 'At Risk', 'Hibernating', 'Lost',
];

/** Theme-aware color per segment (CSS vars + color-mix so light/dark both work). */
export const SEGMENT_COLORS = {
  Champions: C.primary,
  Loyal: C.teal,
  'Potential Loyalist': C.violet,
  New: C.success,
  Promising: C.pink,
  'Need Attention': C.warning,
  'About To Sleep': `color-mix(in oklab, ${C.warning} 55%, ${C.fg3})`,
  'At Risk': C.danger,
  Hibernating: `color-mix(in oklab, ${C.violet} 45%, ${C.fg3})`,
  Lost: C.fg3,
};

/** Fallback descriptions when the API omits them. */
export const SEGMENT_DESCRIPTIONS = {
  Champions: 'Bought recently, buy often and spend the most.',
  Loyal: 'Frequent buyers with solid spend — respond well to loyalty perks.',
  'Potential Loyalist': 'Recent customers with more than one order; nurture them into loyal buyers.',
  New: 'Made their first purchase very recently.',
  Promising: 'Recent shoppers who have not spent much yet.',
  'Need Attention': 'Above-average recency, frequency and spend, but slipping.',
  'About To Sleep': 'Below-average recency and frequency — will be lost without a nudge.',
  'At Risk': 'Used to spend big and often, but not for a long time.',
  Hibernating: 'Last purchase long ago, low spend and few orders.',
  Lost: 'Lowest recency, frequency and monetary scores.',
};

export const segmentColor = (s) => SEGMENT_COLORS[s] || C.fg3;
export const segmentDescription = (s, fromApi) => fromApi || SEGMENT_DESCRIPTIONS[s] || '';
/** Translucent tint of a segment color for backgrounds. */
export const segmentTint = (s, pct = 16) => `color-mix(in oklab, ${segmentColor(s)} ${pct}%, transparent)`;
