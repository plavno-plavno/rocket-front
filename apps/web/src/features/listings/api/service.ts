import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListListingsQuery, GetListingsSummaryQuery } from './types';

/** GET /listings — Listings (cards) in scope */
export async function listListings(params?: ListListingsQuery) {
  const { data } = await coreClient().GET('/listings', { params: { query: query(params ?? {}) } });
  return data!;
}

/** GET /listings/summary — Status counters (SCR-1 stat cards) */
export async function getListingsSummary(params?: GetListingsSummaryQuery) {
  const { data } = await coreClient().GET('/listings/summary', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /listings/{id} — Listing */
export async function getListing(id: string) {
  const { data } = await coreClient().GET('/listings/{id}', { params: { path: { id } } });
  return data!;
}

/** GET /listings/{id}/operations — Sync operations of a listing */
export async function listListingOperations(id: string) {
  const { data } = await coreClient().GET('/listings/{id}/operations', {
    params: { path: { id } }
  });
  return data!;
}

/** POST /listings/{id}/actions — Resolve an action_required state */
export async function actOnListing(id: string, body: OperationBody<'act_on_listing'>) {
  const { data } = await coreClient().POST('/listings/{id}/actions', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** POST /listings/{id}/link — Link listing to a location (confirm match) */
export async function linkListing(id: string, body: OperationBody<'link_listing'>) {
  const { data } = await coreClient().POST('/listings/{id}/link', {
    params: { path: { id } },
    body
  });
  return data!;
}
