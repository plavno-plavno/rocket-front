import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { ListPage } from '@/components/lp';
import { Skeleton } from '@/components/ui/skeleton';
import { requireAccess } from '@/features/session/server';
import { sourcesOverviewQueryOptions } from '@/features/sources/api/queries';
import { SourcesOverview } from '@/features/sources/components/sources-overview';
import { sourcesSearchParamsCache } from '@/features/sources/searchparams';
import { getQueryClient } from '@/lib/query-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('sources.page');
  return { title: t('title') };
}

/** S-SRC-01 «Источники» — owned by UI-F1. */
export default async function SourcesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { scope } = await sourcesSearchParamsCache.parse(searchParams);
  const [t, access] = await Promise.all([
    getTranslations('sources.page'),
    requireAccess({ permission: 'locations.read' })
  ]);
  const queryClient = getQueryClient();
  if (access) await queryClient.prefetchQuery(sourcesOverviewQueryOptions(scope));

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
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className='h-96 w-full' />}>
          <SourcesOverview key={scope} />
        </Suspense>
      </HydrationBoundary>
    </ListPage>
  );
}
