import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'sources',
  track: 'UI-F1',
  status: 'ready',
  screens: ['S-SRC-01', 'S-SET-06'],
  nav: [
    {
      group: 'work',
      order: 20,
      titleKey: 'sources.nav.list',
      url: '/dashboard/sources',
      icon: 'sources',
      access: { permission: 'locations.read' }
    }
  ],
  routes: ['/dashboard/sources']
});
