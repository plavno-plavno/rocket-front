import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'presence',
  track: 'UI-F4',
  status: 'ready',
  screens: ['S-PRS-01'],
  nav: [
    {
      group: 'analytics',
      order: 20,
      titleKey: 'presence.nav.root',
      url: '/dashboard/presence',
      icon: 'presence',
      access: {
        permission: 'analytics.read'
      },
      children: [
        {
          titleKey: 'presence.nav.overview',
          url: '/dashboard/presence'
        },
        {
          titleKey: 'presence.nav.sync',
          url: '/dashboard/presence/sync'
        },
        {
          titleKey: 'presence.nav.keywords',
          url: '/dashboard/presence/keywords'
        }
      ]
    }
  ],
  routes: ['/dashboard/presence']
});
