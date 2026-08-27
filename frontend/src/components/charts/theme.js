/** Chart palette + shared props. Colors read CSS vars so light/dark both work. */
export const C = {
  primary: 'rgb(var(--primary))',
  teal: 'rgb(var(--teal))',
  pink: 'rgb(var(--pink))',
  violet: 'rgb(var(--violet))',
  success: 'rgb(var(--success))',
  danger: 'rgb(var(--danger))',
  warning: 'rgb(var(--warning))',
  fg3: 'rgb(var(--fg-3))',
  line: 'rgb(var(--line) / 0.08)',
};
export const SERIES = [C.primary, C.teal, C.pink, C.violet, C.warning, C.success, C.danger];

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: C.fg3, fontSize: 11 },
  tickMargin: 8,
};
export const gridProps = { vertical: false, stroke: C.line, strokeDasharray: '3 6' };
export const animation = { animationDuration: 900, animationEasing: 'ease-out' };
