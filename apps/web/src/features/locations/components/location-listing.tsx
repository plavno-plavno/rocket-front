import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { getQueryClient } from '@/lib/query-client';
import { locationsQueryOptions } from '../api/queries';
import { locationsSearchParamsCache, toLocationListQuery } from '../searchparams';
import { LocationTable } from './location-table';

/** Server wrapper: prefetches the first page from the URL state, then streams the client table. */
export function LocationListing() {
  const params = locationsSearchParamsCache.all();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(locationsQueryOptions(toLocationListQuery(params)));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<DataTableSkeleton columnCount={6} rowCount={10} filterCount={3} />}>
        <LocationTable />
      </Suspense>
    </HydrationBoundary>
  );
}
