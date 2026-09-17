import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ListPage } from '@/components/lp';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicationsList } from '@/features/publications/components/publications-list';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('publications.page');
  return { title: t('title') };
}

/** S-PUB-01 — owned by UI-F5. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('publications.page'),
    requireAccess({ permission: 'locations.read' })
  ]);
  return (
    <ListPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      access={access}
    >
      <Suspense fallback={<Skeleton className='h-96' />}>
        <PublicationsList />
      </Suspense>
    </ListPage>
  );
}
