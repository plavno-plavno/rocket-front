import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ListPage } from '@/components/lp';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignAnalytics } from '@/features/review-generation/components/campaign-analytics';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('review-generation');
  return { title: t('screens.analytics.title') };
}

/** S-GEN-01 «Аналитика» — owned by UI-F6. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('review-generation'),
    requireAccess({ permission: 'reviews.read', feature: 'review_generation' })
  ]);
  return (
    <ListPage
      title={t('screens.analytics.title')}
      description={t('screens.analytics.description')}
      infoContent={{
        title: t('page.info.title'),
        sections: [{ title: t('page.info.title'), description: t('page.info.body') }]
      }}
      access={access}
    >
      <Suspense fallback={<Skeleton className='h-96' />}>
        <CampaignAnalytics />
      </Suspense>
    </ListPage>
  );
}
