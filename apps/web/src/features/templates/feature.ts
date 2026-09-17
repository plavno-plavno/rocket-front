import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'templates',
  track: 'UI-F3',
  status: 'ready',
  screens: ['S-REV-02'],
  nav: [
    {
      group: 'reviews',
      order: 20,
      titleKey: 'templates.nav.list',
      url: '/dashboard/reviews/templates',
      icon: 'template',
      access: {
        permission: 'reviews.reply'
      }
    }
  ],
  routes: ['/dashboard/reviews/templates']
});
