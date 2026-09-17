import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { InboxPage } from '@/components/lp';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ConversationDetail,
  ConversationsFiltersPanel,
  ConversationsFiltersSheet,
  ConversationsList
} from '@/features/communication/components/communication-inbox';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('communication.page');
  return { title: t('title') };
}

/** S-COM-01 «Коммуникация» [H-UI-05] — owned by UI-F6. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('communication.page'),
    requireAccess({ permission: 'reviews.read', feature: 'communication' })
  ]);
  const fallback = <Skeleton className='m-3 h-64' />;
  return (
    <InboxPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      actions={
        <Suspense fallback={null}>
          <ConversationsFiltersSheet />
        </Suspense>
      }
      list={
        <Suspense fallback={fallback}>
          <ConversationsList />
        </Suspense>
      }
      detail={
        <Suspense fallback={fallback}>
          <ConversationDetail />
        </Suspense>
      }
      filters={
        <Suspense fallback={fallback}>
          <ConversationsFiltersPanel />
        </Suspense>
      }
      detailParam='conversation'
      access={access}
    />
  );
}
