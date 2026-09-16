import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'communication',
  track: 'UI-F6',
  status: 'planned',
  screens: ['S-COM-01'],
  nav: [
    {
      group: 'reviews',
      order: 80,
      titleKey: 'communication.nav.inbox',
      url: '/dashboard/communication',
      icon: 'chat',
      access: {
        feature: 'communication'
      }
    }
  ],
  routes: ['/dashboard/communication']
});
