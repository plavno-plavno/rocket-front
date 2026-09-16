import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListPublicationsQuery } from './types';

/** GET /publications — List publications */
export async function listPublications(params?: ListPublicationsQuery) {
  const { data } = await coreClient().GET('/publications', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /publications — Create publication */
export async function createPublication(body: OperationBody<'create_publication'>) {
  const { data } = await coreClient().POST('/publications', { body });
  return data!;
}

/** GET /publications/{id} — Get publication */
export async function getPublication(id: string) {
  const { data } = await coreClient().GET('/publications/{id}', { params: { path: { id } } });
  return data!;
}

/** PUT /publications/{id} — Update publication */
export async function updatePublication(id: string, body: OperationBody<'update_publication'>) {
  const { data } = await coreClient().PUT('/publications/{id}', { params: { path: { id } }, body });
  return data!;
}

/** DELETE /publications/{id} — Delete publication */
export async function deletePublication(id: string) {
  await coreClient().DELETE('/publications/{id}', { params: { path: { id } } });
}

/** POST /publications/{id}/retry — Retry failed listings */
export async function retryPublication(id: string) {
  const { data } = await coreClient().POST('/publications/{id}/retry', {
    params: { path: { id } }
  });
  return data!;
}
