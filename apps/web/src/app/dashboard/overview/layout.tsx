import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PageContainer from '@/components/layout/page-container';
import { OverviewHeaderActions } from '@/features/overview/components/overview-header-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('overview.page');
  return { title: t('title') };
}

/**
 * S-OVR-01 «Обзор» (SDD-01 §8): parallel routes so every widget streams and fails independently.
 * Slot contents are the public widgets of F1 / F2 / F4 (owned by UI-F8).
 */
export default async function OverviewLayout({
  kpi,
  reviews_trend,
  presence_trend,
  recent_reviews,
  action_required
}: {
  kpi: React.ReactNode;
  reviews_trend: React.ReactNode;
  presence_trend: React.ReactNode;
  recent_reviews: React.ReactNode;
  action_required: React.ReactNode;
}) {
  const t = await getTranslations('overview.page');
  return (
    <PageContainer
      pageTitle={t('title')}
      pageDescription={t('description')}
      pageHeaderAction={<OverviewHeaderActions />}
    >
      <div className='flex flex-1 flex-col gap-4' data-template='analytics'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>{kpi}</div>
        <div className='grid gap-4 lg:grid-cols-2'>
          {reviews_trend}
          {presence_trend}
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          {recent_reviews}
          {action_required}
        </div>
      </div>
    </PageContainer>
  );
}
