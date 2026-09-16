import { coreClient } from '@/lib/api';

/** GET /exports — Recent exports */
export async function listExports() {
  const { data } = await coreClient().GET('/exports');
  return data!;
}

/** GET /exports/{id} — Export status and download link */
export async function getExport(id: string) {
  const { data } = await coreClient().GET('/exports/{id}', { params: { path: { id } } });
  return data!;
}
