import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListDuplicatesQuery, GetDuplicatesSummaryQuery } from './types';

/** GET /duplicates — Queue of duplicate / fake cases */
export async function listDuplicates(params?: ListDuplicatesQuery) {
  const { data } = await coreClient().GET('/duplicates', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /duplicates/summary — Counters */
export async function getDuplicatesSummary(params?: GetDuplicatesSummaryQuery) {
  const { data } = await coreClient().GET('/duplicates/summary', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /duplicates/{id} — Case details */
export async function getDuplicate(id: string) {
  const { data } = await coreClient().GET('/duplicates/{id}', { params: { path: { id } } });
  return data!;
}

/** POST /duplicates/{id}/actions — Resolve a case */
export async function actOnDuplicate(id: string, body: OperationBody<'act_on_duplicate'>) {
  const { data } = await coreClient().POST('/duplicates/{id}/actions', {
    params: { path: { id } },
    body
  });
  return data!;
}
