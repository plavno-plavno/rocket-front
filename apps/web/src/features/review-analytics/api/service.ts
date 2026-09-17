import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
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
  GetReviewConcordanceQuery,
  ExportReviewAnalyticsQuery
} from './types';

/** GET /analytics/reviews/summary — KPI row (SCR-4) */
export async function getReviewAnalyticsSummary(params: GetReviewAnalyticsSummaryQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/summary', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/reviews/trend — Reviews over time */
export async function getReviewTrend(params: GetReviewTrendQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/trend', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/reviews/regions — Distribution by country and region (choropleth) */
export async function getReviewRegions(params: GetReviewRegionsQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/regions', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/reviews/locations — Ranking by locations */
export async function getReviewLocationsRanking(params: GetReviewLocationsRankingQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/locations', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/reviews/cities — Ranking by cities */
export async function getReviewCitiesRanking(params: GetReviewCitiesRankingQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/cities', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/reviews/tags — Ranking by tags */
export async function getReviewTagsRanking(params: GetReviewTagsRankingQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/tags', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/reviews/phrases — Ranking by phrases */
export async function getReviewPhrasesRanking(params: GetReviewPhrasesRankingQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/phrases', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/reviews/topics — Ranking by topics */
export async function getReviewTopicsRanking(params: GetReviewTopicsRankingQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/topics', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/reviews/staff — Staff performance */
export async function getReviewStaff(params: GetReviewStaffQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/staff', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/reviews/concordance — Keyword in context */
export async function getReviewConcordance(params: GetReviewConcordanceQuery) {
  const { data } = await coreClient().GET('/analytics/reviews/concordance', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /analytics/reviews/export — Download report (async) */
export async function exportReviewAnalytics(
  body: OperationBody<'export_review_analytics'>,
  params?: ExportReviewAnalyticsQuery
) {
  const { data } = await coreClient().POST('/analytics/reviews/export', {
    params: { query: query(params ?? {}) },
    body
  });
  return data!;
}

/** GET /exports/{id} — poll an async report until `done` (see `waitForExport`). */
export async function getExport(id: string) {
  const { data } = await coreClient().GET('/exports/{id}', { params: { path: { id } } });
  return data!;
}
