'use client';

import { useTranslations } from 'next-intl';
import { RatingStars } from '@/components/lp';
import { RecentReviewsList } from '@/features/reviews';
import { WidgetConfigurator, type WidgetConfig } from './widget-configurator';

/** Preview of the reviews widget: brand header + the tenant's recent reviews (public F2 list). */
function ReviewsPreview({ config }: { config: WidgetConfig }) {
  const t = useTranslations('widgets.preview');
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='text-sm font-semibold'>{t('title')}</div>
          <div className='text-muted-foreground text-xs'>
            {t('minRating', { count: config.min_rating ?? 1 })} ·{' '}
            {t('limit', { count: config.limit ?? 12 })}
          </div>
        </div>
        <RatingStars rating={4.6} size='sm' showValue />
      </div>
      <RecentReviewsList scope='all' limit={Math.min(5, config.limit ?? 5)} />
      <p className='text-muted-foreground text-center text-[10px]'>{t('poweredBy')}</p>
    </div>
  );
}

/** S-WID-01 «Виджет с отзывами». */
export function ReviewsWidget() {
  return (
    <WidgetConfigurator
      kind='reviews'
      renderPreview={(config) => <ReviewsPreview config={config} />}
    />
  );
}
