import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'review-analytics',
  track: 'UI-F4',
  status: 'planned',
  screens: [
    'S-ANL-01',
    'S-ANL-02',
    'S-ANL-03',
    'S-ANL-04',
    'S-ANL-05',
    'S-ANL-06',
    'S-ANL-07',
    'S-ANL-08'
  ],
  nav: [
    {
      group: 'analytics',
      order: 10,
      titleKey: 'review-analytics.nav.root',
      url: '/dashboard/analytics/reviews',
      icon: 'analytics',
      access: {
        permission: 'analytics.read'
      },
      children: [
        {
          titleKey: 'review-analytics.nav.panel',
          url: '/dashboard/analytics/reviews'
        },
        {
          titleKey: 'review-analytics.nav.locations',
          url: '/dashboard/analytics/reviews/locations'
        },
        {
          titleKey: 'review-analytics.nav.cities',
          url: '/dashboard/analytics/reviews/cities'
        },
        {
          titleKey: 'review-analytics.nav.tags',
          url: '/dashboard/analytics/reviews/tags'
        },
        {
          titleKey: 'review-analytics.nav.phrases',
          url: '/dashboard/analytics/reviews/phrases'
        },
        {
          titleKey: 'review-analytics.nav.staff',
          url: '/dashboard/analytics/reviews/staff'
        },
        {
          titleKey: 'review-analytics.nav.topics',
          url: '/dashboard/analytics/reviews/topics'
        },
        {
          titleKey: 'review-analytics.nav.concordance',
          url: '/dashboard/analytics/reviews/concordance'
        }
      ]
    }
  ],
  routes: ['/dashboard/analytics/reviews']
});
