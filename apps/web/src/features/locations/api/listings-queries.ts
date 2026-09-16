import { queryOptions } from '@tanstack/react-query';
import type { OperationQuery } from '@lp/contracts';
import { coreClient, query } from '@/lib/api';
import { locationKeys } from './queries';

export type ListingListQuery = OperationQuery<'list_listings'>;

async function listListings(params: ListingListQuery) {
  const { data } = await coreClient().GET('/listings', { params: { query: query(params) } });
  return data!;
}

/** Listings read-model queries used by locations screens and public widgets. */
export const listingsQueryOptions = (params: ListingListQuery) =>
  queryOptions({
    queryKey: [...locationKeys.all, 'listings-list', params.scope ?? 'all', params] as const,
    queryFn: () => listListings(params),
    staleTime: 30 * 1000
  });
