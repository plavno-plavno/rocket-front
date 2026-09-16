import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'ai-replies',
  track: 'UI-F3',
  status: 'planned',
  screens: ['S-REV-05'],
  nav: [
    {
      group: 'reviews',
      order: 50,
      titleKey: 'ai-replies.nav.ai',
      url: '/dashboard/reviews/ai',
      icon: 'sparkles',
      label: 'new',
      access: {
        permission: 'reviews.reply',
        feature: 'ai_replies'
      }
    }
  ],
  routes: ['/dashboard/reviews/ai']
});
