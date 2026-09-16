import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListReplyTemplatesQuery, ListTemplateGroupsQuery } from './types';

/** GET /reply-templates — List reply templates */
export async function listReplyTemplates(params?: ListReplyTemplatesQuery) {
  const { data } = await coreClient().GET('/reply-templates', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /reply-templates — Create reply template */
export async function createReplyTemplate(body: OperationBody<'create_reply_template'>) {
  const { data } = await coreClient().POST('/reply-templates', { body });
  return data!;
}

/** GET /reply-templates/{id} — Get reply template */
export async function getReplyTemplate(id: string) {
  const { data } = await coreClient().GET('/reply-templates/{id}', { params: { path: { id } } });
  return data!;
}

/** PATCH /reply-templates/{id} — Update reply template */
export async function updateReplyTemplate(
  id: string,
  body: OperationBody<'update_reply_template'>
) {
  const { data } = await coreClient().PATCH('/reply-templates/{id}', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** DELETE /reply-templates/{id} — Delete reply template */
export async function deleteReplyTemplate(id: string) {
  await coreClient().DELETE('/reply-templates/{id}', { params: { path: { id } } });
}

/** POST /reply-templates/bulk — Bulk actions on templates */
export async function bulkReplyTemplates(body: OperationBody<'bulk_reply_templates'>) {
  const { data } = await coreClient().POST('/reply-templates/bulk', { body });
  return data!;
}

/** POST /reply-templates/reorder — Persist drag-and-drop order */
export async function reorderReplyTemplates(body: OperationBody<'reorder_reply_templates'>) {
  await coreClient().POST('/reply-templates/reorder', { body });
}

/** POST /reply-templates/render — Render a template body against a review */
export async function renderReplyTemplate(body: OperationBody<'render_reply_template'>) {
  const { data } = await coreClient().POST('/reply-templates/render', { body });
  return data!;
}

/** GET /template-groups — List template groups */
export async function listTemplateGroups(params?: ListTemplateGroupsQuery) {
  const { data } = await coreClient().GET('/template-groups', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /template-groups — Create template group */
export async function createTemplateGroup(body: OperationBody<'create_template_group'>) {
  const { data } = await coreClient().POST('/template-groups', { body });
  return data!;
}

/** GET /template-groups/{id} — Get template group */
export async function getTemplateGroup(id: string) {
  const { data } = await coreClient().GET('/template-groups/{id}', { params: { path: { id } } });
  return data!;
}

/** PUT /template-groups/{id} — Update template group */
export async function updateTemplateGroup(
  id: string,
  body: OperationBody<'update_template_group'>
) {
  const { data } = await coreClient().PUT('/template-groups/{id}', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** DELETE /template-groups/{id} — Delete template group */
export async function deleteTemplateGroup(id: string) {
  await coreClient().DELETE('/template-groups/{id}', { params: { path: { id } } });
}

/** POST /template-groups/reorder — Persist group order */
export async function reorderTemplateGroups(body: OperationBody<'reorder_template_groups'>) {
  await coreClient().POST('/template-groups/reorder', { body });
}
