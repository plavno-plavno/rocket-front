import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getPresenceSummary,
  getPresenceTrend,
  getPresenceSyncMatrix,
  getPresencePlatform,
  getPresenceKeywords
} from './service';
import type {
  GetPresenceSummaryQuery,
  GetPresenceTrendQuery,
  GetPresenceSyncMatrixQuery,
  GetPresencePlatformQuery,
  GetPresenceKeywordsQuery
} from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const presenceKeys = {
  all: ['presence'] as const,
  presenceSummary: (params: GetPresenceSummaryQuery) =>
    [...presenceKeys.all, 'presenceSummary', params?.scope ?? 'all', params ?? {}] as const,
  presenceTrend: (params: GetPresenceTrendQuery) =>
    [...presenceKeys.all, 'presenceTrend', params?.scope ?? 'all', params ?? {}] as const,
  presenceSyncMatrix: (params?: GetPresenceSyncMatrixQuery) =>
    [...presenceKeys.all, 'presenceSyncMatrix', params?.scope ?? 'all', params ?? {}] as const,
  presencePlatform: (platformId: string, params: GetPresencePlatformQuery) =>
    [
      ...presenceKeys.all,
      'presencePlatform',
      platformId,
      params?.scope ?? 'all',
      params ?? {}
    ] as const,
  presenceKeywords: (params?: GetPresenceKeywordsQuery) =>
    [...presenceKeys.all, 'presenceKeywords', params?.scope ?? 'all', params ?? {}] as const
};

export const presenceSummaryQueryOptions = (params: GetPresenceSummaryQuery) =>
  queryOptions({
    queryKey: presenceKeys.presenceSummary(params),
    queryFn: () => getPresenceSummary(params),
    // Filter/period changes keep the previous numbers on screen instead of a skeleton flash.
    placeholderData: keepPreviousData
  });

export const presenceTrendQueryOptions = (params: GetPresenceTrendQuery) =>
  queryOptions({
    queryKey: presenceKeys.presenceTrend(params),
    queryFn: () => getPresenceTrend(params)
  });

export const presenceSyncMatrixQueryOptions = (params?: GetPresenceSyncMatrixQuery) =>
  queryOptions({
    queryKey: presenceKeys.presenceSyncMatrix(params),
    queryFn: () => getPresenceSyncMatrix(params)
  });

export const presencePlatformQueryOptions = (
  platformId: string,
  params: GetPresencePlatformQuery
) =>
  queryOptions({
    queryKey: presenceKeys.presencePlatform(platformId, params),
    queryFn: () => getPresencePlatform(platformId, params)
  });

export const presenceKeywordsQueryOptions = (params?: GetPresenceKeywordsQuery) =>
  queryOptions({
    queryKey: presenceKeys.presenceKeywords(params),
    queryFn: () => getPresenceKeywords(params)
  });
