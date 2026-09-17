import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { SearchParams } from 'nuqs/server';
import { InboxPage } from '@/components/lp';
import { InboxActions } from '@/features/reviews/components/inbox/inbox-actions';
import { ReviewFiltersPanel } from '@/features/reviews/components/inbox/review-filters';
import { ReviewKpis } from '@/features/reviews/components/inbox/review-kpis';
import { ReviewsInbox } from '@/features/reviews/components/inbox/reviews-inbox';
import { reviewsSearchParamsCache } from '@/features/reviews/searchparams';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reviews.page');
  return { title: t('title') };
}

/** S-REV-01 «Обработка отзывов» — owned by UI-F2. */
export default async function ReviewsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await reviewsSearchParamsCache.parse(searchParams);
  const [t, access] = await Promise.all([
    getTranslations('reviews.page'),
    requireAccess({ permission: 'reviews.read' })
  ]);

  return (
    <InboxPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      actions={<InboxActions />}
      kpi={<ReviewKpis />}
      list={<ReviewsInbox column='list' />}
      detail={<ReviewsInbox column='detail' />}
      filters={<ReviewFiltersPanel />}
      detailParam='review'
      access={access}
    />
  );
}
