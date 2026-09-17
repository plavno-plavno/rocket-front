import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ListPage } from '@/components/lp';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCenter } from '@/features/help/components/help-center';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('help.page');
  return { title: t('title') };
}

/** Help centre — owned by UI-0: knowledge base, shortcuts, support. */
export default async function Page() {
  const t = await getTranslations('help.page');
  return (
    <ListPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
    >
      <Suspense fallback={<Skeleton className='h-96' />}>
        <HelpCenter />
      </Suspense>
    </ListPage>
  );
}
