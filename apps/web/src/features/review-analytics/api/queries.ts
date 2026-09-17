import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getReviewAnalyticsSummary,
  getReviewTrend,
  getReviewRegions,
  getReviewLocationsRanking,
  getReviewCitiesRanking,
  getReviewTagsRanking,
  getReviewPhrasesRanking,
  getReviewTopicsRanking,
  getReviewStaff,
  getReviewConcordance
} from './service';
import type {
  GetReviewAnalyticsSummaryQuery,
  GetReviewTrendQuery,
  GetReviewRegionsQuery,
  GetReviewLocationsRankingQuery,
  GetReviewCitiesRankingQuery,
  GetReviewTagsRankingQuery,
  GetReviewPhrasesRankingQuery,
  GetReviewTopicsRankingQuery,
  GetReviewStaffQuery,
  GetReviewConcordanceQuery
} from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const reviewAnalyticsKeys = {
  all: ['review-analytics'] as const,
  reviewAnalyticsSummary: (params: GetReviewAnalyticsSummaryQuery) =>
    [
      ...reviewAnalyticsKeys.all,
      'reviewAnalyticsSummary',
      params?.scope ?? 'all',
      params ?? {}
    ] as const,
  reviewTrend: (params: GetReviewTrendQuery) =>
    [...reviewAnalyticsKeys.all, 'reviewTrend', params?.scope ?? 'all', params ?? {}] as const,
  reviewRegions: (params: GetReviewRegionsQuery) =>
    [...reviewAnalyticsKeys.all, 'reviewRegions', params?.scope ?? 'all', params ?? {}] as const,
  reviewLocationsRanking: (params: GetReviewLocationsRankingQuery) =>
    [
      ...reviewAnalyticsKeys.all,
      'reviewLocationsRanking',
      params?.scope ?? 'all',
      params ?? {}
    ] as const,
  reviewCitiesRanking: (params: GetReviewCitiesRankingQuery) =>
    [
      ...reviewAnalyticsKeys.all,
      'reviewCitiesRanking',
      params?.scope ?? 'all',
      params ?? {}
    ] as const,
  reviewTagsRanking: (params: GetReviewTagsRankingQuery) =>
    [
      ...reviewAnalyticsKeys.all,
      'reviewTagsRanking',
      params?.scope ?? 'all',
      params ?? {}
    ] as const,
  reviewPhrasesRanking: (params: GetReviewPhrasesRankingQuery) =>
    [
      ...reviewAnalyticsKeys.all,
      'reviewPhrasesRanking',
      params?.scope ?? 'all',
      params ?? {}
    ] as const,
  reviewTopicsRanking: (params: GetReviewTopicsRankingQuery) =>
    [
      ...reviewAnalyticsKeys.all,
      'reviewTopicsRanking',
      params?.scope ?? 'all',
      params ?? {}
    ] as const,
  reviewStaff: (params: GetReviewStaffQuery) =>
    [...reviewAnalyticsKeys.all, 'reviewStaff', params?.scope ?? 'all', params ?? {}] as const,
  reviewConcordance: (params: GetReviewConcordanceQuery) =>
    [...reviewAnalyticsKeys.all, 'reviewConcordance', params?.scope ?? 'all', params ?? {}] as const
};

export const reviewAnalyticsSummaryQueryOptions = (params: GetReviewAnalyticsSummaryQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewAnalyticsSummary(params),
    queryFn: () => getReviewAnalyticsSummary(params),
    // Filter/period changes keep the previous numbers on screen instead of a skeleton flash.
    placeholderData: keepPreviousData
  });

export const reviewTrendQueryOptions = (params: GetReviewTrendQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewTrend(params),
    queryFn: () => getReviewTrend(params)
  });

export const reviewRegionsQueryOptions = (params: GetReviewRegionsQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewRegions(params),
    queryFn: () => getReviewRegions(params)
  });

export const reviewLocationsRankingQueryOptions = (params: GetReviewLocationsRankingQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewLocationsRanking(params),
    queryFn: () => getReviewLocationsRanking(params)
  });

export const reviewCitiesRankingQueryOptions = (params: GetReviewCitiesRankingQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewCitiesRanking(params),
    queryFn: () => getReviewCitiesRanking(params)
  });

export const reviewTagsRankingQueryOptions = (params: GetReviewTagsRankingQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewTagsRanking(params),
    queryFn: () => getReviewTagsRanking(params)
  });

export const reviewPhrasesRankingQueryOptions = (params: GetReviewPhrasesRankingQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewPhrasesRanking(params),
    queryFn: () => getReviewPhrasesRanking(params)
  });

export const reviewTopicsRankingQueryOptions = (params: GetReviewTopicsRankingQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewTopicsRanking(params),
    queryFn: () => getReviewTopicsRanking(params)
  });

export const reviewStaffQueryOptions = (params: GetReviewStaffQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewStaff(params),
    queryFn: () => getReviewStaff(params)
  });

export const reviewConcordanceQueryOptions = (params: GetReviewConcordanceQuery) =>
  queryOptions({
    queryKey: reviewAnalyticsKeys.reviewConcordance(params),
    queryFn: () => getReviewConcordance(params)
  });
