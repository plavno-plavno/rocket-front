/**
 * Default theme that loads when no user preference is set.
 * `lp` is the product theme (SDD-01 §3.1); `vercel` is kept as the starter donor for comparison.
 */
export const DEFAULT_THEME = 'lp';

export const THEMES = [
  {
    name: 'Local Presence',
    value: 'lp'
  },
  {
    name: 'Vercel',
    value: 'vercel'
  }
];
