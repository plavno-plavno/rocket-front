import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListTagsQuery } from './types';

/** GET /tags — List tags */
export async function listTags(params?: ListTagsQuery) {
  const { data } = await coreClient().GET('/tags', { params: { query: query(params ?? {}) } });
  return data!;
}

/** POST /tags — Create tag */
export async function createTag(body: OperationBody<'create_tag'>) {
  const { data } = await coreClient().POST('/tags', { body });
  return data!;
}

/** GET /tags/{id} — Get tag */
export async function getTag(id: string) {
  const { data } = await coreClient().GET('/tags/{id}', { params: { path: { id } } });
  return data!;
}

/** PUT /tags/{id} — Update tag */
export async function updateTag(id: string, body: OperationBody<'update_tag'>) {
  const { data } = await coreClient().PUT('/tags/{id}', { params: { path: { id } }, body });
  return data!;
}

/** DELETE /tags/{id} — Delete tag */
export async function deleteTag(id: string) {
  await coreClient().DELETE('/tags/{id}', { params: { path: { id } } });
}
