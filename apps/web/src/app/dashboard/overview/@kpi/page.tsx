import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { SearchParams } from 'nuqs/server';
import { OverviewKpis } from '@/features/overview/components/overview-kpis';
import { overviewSearchParamsCache } from '@/features/overview/searchparams';
import { listingsSummaryQueryOptions } from '@/features/locations';
import { badgesQueryOptions } from '@/features/session';
import { getQueryClient } from '@/lib/query-client';

export default async function KpiSlot({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { scope } = await overviewSearchParamsCache.parse(searchParams);
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(listingsSummaryQueryOptions(scope));
  void queryClient.prefetchQuery(badgesQueryOptions(scope));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OverviewKpis />
    </HydrationBoundary>
  );
}
