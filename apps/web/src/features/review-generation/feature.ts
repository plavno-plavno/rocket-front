import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'review-generation',
  track: 'UI-F6',
  status: 'planned',
  screens: ['S-GEN-01'],
  nav: [
    {
      group: 'reviews',
      order: 70,
      titleKey: 'review-generation.nav.root',
      url: '/dashboard/review-generation/campaigns',
      icon: 'megaphone',
      access: {
        feature: 'review_generation'
      },
      children: [
        {
          titleKey: 'review-generation.nav.campaigns',
          url: '/dashboard/review-generation/campaigns'
        },
        {
          titleKey: 'review-generation.nav.qr',
          url: '/dashboard/review-generation/qr'
        },
        {
          titleKey: 'review-generation.nav.analytics',
          url: '/dashboard/review-generation/analytics'
        }
      ]
    }
  ],
  routes: ['/dashboard/review-generation']
});
