import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListWidgetsQuery } from './types';

/** GET /widgets — List widgets */
export async function listWidgets(params?: ListWidgetsQuery) {
  const { data } = await coreClient().GET('/widgets', { params: { query: query(params ?? {}) } });
  return data!;
}

/** POST /widgets — Create widget */
export async function createWidget(body: OperationBody<'create_widget'>) {
  const { data } = await coreClient().POST('/widgets', { body });
  return data!;
}

/** GET /widgets/{id} — Get widget */
export async function getWidget(id: string) {
  const { data } = await coreClient().GET('/widgets/{id}', { params: { path: { id } } });
  return data!;
}

/** PUT /widgets/{id} — Update widget */
export async function updateWidget(id: string, body: OperationBody<'update_widget'>) {
  const { data } = await coreClient().PUT('/widgets/{id}', { params: { path: { id } }, body });
  return data!;
}

/** DELETE /widgets/{id} — Delete widget */
export async function deleteWidget(id: string) {
  await coreClient().DELETE('/widgets/{id}', { params: { path: { id } } });
}

/** POST /widgets/{id}/rotate-key — Rotate public key */
export async function rotateWidgetKey(id: string) {
  const { data } = await coreClient().POST('/widgets/{id}/rotate-key', {
    params: { path: { id } }
  });
  return data!;
}
