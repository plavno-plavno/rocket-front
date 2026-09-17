import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type {
  GetPresenceSummaryQuery,
  GetPresenceTrendQuery,
  GetPresenceSyncMatrixQuery,
  GetPresencePlatformQuery,
  GetPresenceKeywordsQuery,
  ExportPresenceQuery
} from './types';

/** GET /analytics/presence/summary — Impressions, actions, conversion (SCR-6) */
export async function getPresenceSummary(params: GetPresenceSummaryQuery) {
  const { data } = await coreClient().GET('/analytics/presence/summary', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/presence/trend — Metrics over time */
export async function getPresenceTrend(params: GetPresenceTrendQuery) {
  const { data } = await coreClient().GET('/analytics/presence/trend', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/presence/sync — Platform × status matrix */
export async function getPresenceSyncMatrix(params?: GetPresenceSyncMatrixQuery) {
  const { data } = await coreClient().GET('/analytics/presence/sync', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/presence/platforms/{platformId} — Per-platform metrics */
export async function getPresencePlatform(platformId: string, params: GetPresencePlatformQuery) {
  const { data } = await coreClient().GET('/analytics/presence/platforms/{platformId}', {
    params: { path: { platformId }, query: query(params ?? {}) }
  });
  return data!;
}

/** GET /analytics/presence/keywords — Search keywords (monthly) */
export async function getPresenceKeywords(params?: GetPresenceKeywordsQuery) {
  const { data } = await coreClient().GET('/analytics/presence/keywords', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /analytics/presence/export — Download data (async) */
export async function exportPresence(
  body: OperationBody<'export_presence'>,
  params?: ExportPresenceQuery
) {
  const { data } = await coreClient().POST('/analytics/presence/export', {
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
