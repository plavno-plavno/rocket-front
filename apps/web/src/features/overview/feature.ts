import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'overview',
  track: 'UI-F8',
  status: 'ready',
  screens: ['S-OVR-01'],
  nav: [
    {
      group: 'work',
      order: 0,
      titleKey: 'overview.nav.overview',
      url: '/dashboard/overview',
      icon: 'dashboard',
      shortcut: ['d', 'o']
    }
  ],
  routes: ['/dashboard/overview']
});
