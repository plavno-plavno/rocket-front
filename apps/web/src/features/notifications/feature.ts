import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'notifications',
  track: 'UI-F7',
  status: 'ready',
  screens: ['S-NOT-01'],
  nav: [
    {
      group: 'settings',
      order: 45,
      titleKey: 'notifications.nav.center',
      url: '/dashboard/notifications',
      icon: 'notification',
      hidden: true
    }
  ],
  routes: ['/dashboard/notifications']
});
