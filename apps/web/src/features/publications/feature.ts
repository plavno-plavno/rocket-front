import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'publications',
  track: 'UI-F5',
  status: 'ready',
  screens: ['S-PUB-01'],
  nav: [
    {
      group: 'content',
      order: 10,
      titleKey: 'publications.nav.list',
      url: '/dashboard/publications',
      icon: 'post',
      access: {
        permission: 'locations.read'
      }
    }
  ],
  routes: ['/dashboard/publications']
});
