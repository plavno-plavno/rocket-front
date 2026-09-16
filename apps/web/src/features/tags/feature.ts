import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'tags',
  track: 'UI-F3',
  status: 'planned',
  screens: ['S-REV-03'],
  nav: [
    {
      group: 'reviews',
      order: 30,
      titleKey: 'tags.nav.list',
      url: '/dashboard/reviews/tags',
      icon: 'tag',
      access: {
        permission: 'reviews.reply'
      }
    }
  ],
  routes: ['/dashboard/reviews/tags']
});
