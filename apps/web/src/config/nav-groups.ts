/**
 * Sidebar groups — fixed by Foundation (SDD-01 §7.2, SDD-01T §3.1). Features attach items to a
 * group via `feature.ts`; nobody edits a shared nav list by hand.
 */
export const NAV_GROUPS = [
  { id: 'work', order: 0, titleKey: 'nav.groups.work' },
  { id: 'reviews', order: 10, titleKey: 'nav.groups.reviews' },
  { id: 'analytics', order: 20, titleKey: 'nav.groups.analytics' },
  { id: 'content', order: 30, titleKey: 'nav.groups.content' },
  { id: 'tools', order: 40, titleKey: 'nav.groups.tools' },
  { id: 'settings', order: 50, titleKey: 'nav.groups.settings' },
  { id: 'help', order: 60, titleKey: 'nav.groups.help' }
] as const;

export type NavGroupId = (typeof NAV_GROUPS)[number]['id'];
