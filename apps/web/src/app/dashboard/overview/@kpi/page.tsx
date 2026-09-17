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
  // Awaited on purpose: with a live core-api the streamed pending queries could resolve on the client before
  // hydration, so the client rendered numbers where the server had streamed skeletons (React #418).
  await Promise.all([
    queryClient.prefetchQuery(listingsSummaryQueryOptions(scope)),
    queryClient.prefetchQuery(badgesQueryOptions(scope))
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OverviewKpis />
    </HydrationBoundary>
  );
}
