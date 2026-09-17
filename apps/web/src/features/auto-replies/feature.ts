import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'auto-replies',
  track: 'UI-F3',
  status: 'ready',
  screens: ['S-REV-04'],
  nav: [
    {
      group: 'reviews',
      order: 40,
      titleKey: 'auto-replies.nav.list',
      url: '/dashboard/reviews/auto-replies',
      icon: 'autoReply',
      access: {
        permission: 'reviews.reply',
        feature: 'auto_replies'
      }
    }
  ],
  routes: ['/dashboard/reviews/auto-replies']
});
