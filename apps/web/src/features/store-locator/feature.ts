import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'store-locator',
  track: 'UI-F6',
  status: 'ready',
  screens: ['S-WID-01'],
  nav: [
    {
      group: 'tools',
      order: 10,
      titleKey: 'store-locator.nav.locator',
      url: '/dashboard/store-locator',
      icon: 'mapPin',
      label: 'beta',
      access: {
        feature: 'store_locator'
      }
    }
  ],
  routes: ['/dashboard/store-locator']
});
