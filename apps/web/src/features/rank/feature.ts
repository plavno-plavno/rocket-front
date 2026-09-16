import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'rank',
  track: 'UI-F4',
  status: 'planned',
  screens: ['S-RNK-01'],
  nav: [
    {
      group: 'analytics',
      order: 30,
      titleKey: 'rank.nav.tracker',
      url: '/dashboard/rank',
      icon: 'rank',
      access: {
        permission: 'analytics.read',
        feature: 'rank_tracker'
      }
    }
  ],
  routes: ['/dashboard/rank']
});
