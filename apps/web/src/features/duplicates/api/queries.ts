import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { listDuplicates, getDuplicatesSummary, getDuplicate } from './service';
import type { ListDuplicatesQuery, GetDuplicatesSummaryQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const duplicatesKeys = {
  all: ['duplicates'] as const,
  duplicates: (params?: ListDuplicatesQuery) =>
    [...duplicatesKeys.all, 'duplicates', params?.scope ?? 'all', params ?? {}] as const,
  duplicatesSummary: (params?: GetDuplicatesSummaryQuery) =>
    [...duplicatesKeys.all, 'duplicatesSummary', params?.scope ?? 'all', params ?? {}] as const,
  duplicate: (id: string) => [...duplicatesKeys.all, 'duplicate', id] as const
};

export const duplicatesQueryOptions = (params?: ListDuplicatesQuery) =>
  queryOptions({
    queryKey: duplicatesKeys.duplicates(params),
    queryFn: () => listDuplicates(params)
  });

export const duplicatesSummaryQueryOptions = (params?: GetDuplicatesSummaryQuery) =>
  queryOptions({
    queryKey: duplicatesKeys.duplicatesSummary(params),
    queryFn: () => getDuplicatesSummary(params),
    // Filter/period changes keep the previous numbers on screen instead of a skeleton flash.
    placeholderData: keepPreviousData
  });

export const duplicateQueryOptions = (id: string) =>
  queryOptions({ queryKey: duplicatesKeys.duplicate(id), queryFn: () => getDuplicate(id) });
