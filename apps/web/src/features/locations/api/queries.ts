import { queryOptions } from '@tanstack/react-query';
import {
  getListingsSummary,
  getLocation,
  getSyncBatch,
  listLocationGroups,
  listLocationListings,
  listLocationVersions,
  listLocations,
  listSyncBatchItems
} from './service';
import type { LocationListQuery } from './types';

/** Query keys are prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (params: LocationListQuery) =>
    [...locationKeys.lists(), params.scope ?? 'all', params] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
  versions: (id: string) => [...locationKeys.detail(id), 'versions'] as const,
  listings: (id: string) => [...locationKeys.detail(id), 'listings'] as const,
  groups: (kind?: string) => [...locationKeys.all, 'groups', kind ?? 'all'] as const,
  summary: (scope: string, platformKind?: string) =>
    [...locationKeys.all, 'summary', scope, platformKind ?? 'all'] as const,
  batch: (id: string) => [...locationKeys.all, 'batch', id] as const,
  batchItems: (id: string, page: number) => [...locationKeys.batch(id), 'items', page] as const
};

export const locationsQueryOptions = (params: LocationListQuery) =>
  queryOptions({
    queryKey: locationKeys.list(params),
    queryFn: () => listLocations(params),
    placeholderData: (prev) => prev
  });

export const locationQueryOptions = (id: string) =>
  queryOptions({ queryKey: locationKeys.detail(id), queryFn: () => getLocation(id) });

export const locationVersionsQueryOptions = (id: string) =>
  queryOptions({ queryKey: locationKeys.versions(id), queryFn: () => listLocationVersions(id) });

export const locationListingsQueryOptions = (id: string) =>
  queryOptions({ queryKey: locationKeys.listings(id), queryFn: () => listLocationListings(id) });

export const locationGroupsQueryOptions = (kind?: string) =>
  queryOptions({
    queryKey: locationKeys.groups(kind),
    queryFn: () => listLocationGroups(kind),
    staleTime: 5 * 60 * 1000
  });

export const syncBatchQueryOptions = (id: string) =>
  queryOptions({
    queryKey: locationKeys.batch(id),
    queryFn: () => getSyncBatch(id),
    refetchInterval: (q) =>
      q.state.data && ['done', 'failed', 'partially_failed'].includes(q.state.data.state)
        ? false
        : 2000
  });

export const syncBatchItemsQueryOptions = (id: string, page = 1) =>
  queryOptions({
    queryKey: locationKeys.batchItems(id, page),
    queryFn: () => listSyncBatchItems(id, page)
  });

export const listingsSummaryQueryOptions = (scope: string, platformKind?: 'map' | 'navigator') =>
  queryOptions({
    queryKey: locationKeys.summary(scope, platformKind),
    queryFn: () => getListingsSummary(scope, platformKind),
    staleTime: 30 * 1000
  });
