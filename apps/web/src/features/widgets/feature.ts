import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'widgets',
  track: 'UI-F6',
  status: 'ready',
  screens: ['S-WID-01'],
  nav: [
    {
      group: 'tools',
      order: 20,
      titleKey: 'widgets.nav.reviews',
      url: '/dashboard/widgets/reviews',
      icon: 'widget',
      access: {
        feature: 'widgets'
      }
    }
  ],
  routes: ['/dashboard/widgets']
});
