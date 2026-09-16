import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'questions',
  track: 'UI-F2',
  status: 'planned',
  screens: ['S-QA-01'],
  nav: [
    {
      group: 'reviews',
      order: 60,
      titleKey: 'questions.nav.inbox',
      url: '/dashboard/questions',
      icon: 'question',
      access: {
        permission: 'reviews.read'
      }
    }
  ],
  routes: ['/dashboard/questions']
});
