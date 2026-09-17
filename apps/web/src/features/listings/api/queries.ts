import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { listListings, getListingsSummary, getListing, listListingOperations } from './service';
import type { ListListingsQuery, GetListingsSummaryQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const listingsKeys = {
  all: ['listings'] as const,
  listings: (params?: ListListingsQuery) =>
    [...listingsKeys.all, 'listings', params?.scope ?? 'all', params ?? {}] as const,
  listingsSummary: (params?: GetListingsSummaryQuery) =>
    [...listingsKeys.all, 'listingsSummary', params?.scope ?? 'all', params ?? {}] as const,
  listing: (id: string) => [...listingsKeys.all, 'listing', id] as const,
  listingOperations: (id: string) => [...listingsKeys.all, 'listingOperations', id] as const
};

export const listingsQueryOptions = (params?: ListListingsQuery) =>
  queryOptions({ queryKey: listingsKeys.listings(params), queryFn: () => listListings(params) });

export const listingsSummaryQueryOptions = (params?: GetListingsSummaryQuery) =>
  queryOptions({
    queryKey: listingsKeys.listingsSummary(params),
    queryFn: () => getListingsSummary(params),
    // Filter/period changes keep the previous numbers on screen instead of a skeleton flash.
    placeholderData: keepPreviousData
  });

export const listingQueryOptions = (id: string) =>
  queryOptions({ queryKey: listingsKeys.listing(id), queryFn: () => getListing(id) });

export const listingOperationsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: listingsKeys.listingOperations(id),
    queryFn: () => listListingOperations(id)
  });
