import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'products',
  track: 'UI-F5',
  status: 'planned',
  screens: ['S-PRD-01'],
  nav: [
    {
      group: 'content',
      order: 30,
      titleKey: 'products.nav.catalog',
      url: '/dashboard/products',
      icon: 'product',
      access: {
        permission: 'locations.read',
        feature: 'products'
      }
    }
  ],
  routes: ['/dashboard/products']
});
