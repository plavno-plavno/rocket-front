import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'duplicates',
  track: 'UI-F5',
  status: 'ready',
  screens: ['S-DUP-01'],
  nav: [
    {
      group: 'content',
      order: 40,
      titleKey: 'duplicates.nav.queue',
      url: '/dashboard/duplicates',
      icon: 'duplicates',
      access: {
        permission: 'locations.read'
      },
      badge: 'duplicates_open'
    }
  ],
  routes: ['/dashboard/duplicates']
});
