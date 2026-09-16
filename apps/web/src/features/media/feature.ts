import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'media',
  track: 'UI-F5',
  status: 'planned',
  screens: ['S-MED-01'],
  nav: [
    {
      group: 'content',
      order: 20,
      titleKey: 'media.nav.manager',
      url: '/dashboard/media',
      icon: 'media',
      access: {
        permission: 'locations.read'
      }
    }
  ],
  routes: ['/dashboard/media']
});
