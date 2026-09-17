import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'reviews',
  track: 'UI-F2',
  status: 'ready',
  screens: ['S-REV-01'],
  nav: [
    {
      group: 'reviews',
      order: 10,
      titleKey: 'reviews.nav.inbox',
      url: '/dashboard/reviews',
      icon: 'reviews',
      shortcut: ['d', 'r'],
      access: {
        permission: 'reviews.read'
      },
      badge: 'reviews_unanswered'
    }
  ],
  kbar: [
    {
      id: 'reviews.open-by-id',
      titleKey: 'reviews.kbar.openById',
      kind: 'dialog'
    }
  ],
  routes: ['/dashboard/reviews']
});
