import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListAutoReplyRulesQuery } from './types';

/** GET /auto-reply-rules — List auto reply rules */
export async function listAutoReplyRules(params?: ListAutoReplyRulesQuery) {
  const { data } = await coreClient().GET('/auto-reply-rules', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /auto-reply-rules — Create auto reply rule */
export async function createAutoReplyRule(body: OperationBody<'create_auto_reply_rule'>) {
  const { data } = await coreClient().POST('/auto-reply-rules', { body });
  return data!;
}

/** GET /auto-reply-rules/{id} — Get auto reply rule */
export async function getAutoReplyRule(id: string) {
  const { data } = await coreClient().GET('/auto-reply-rules/{id}', { params: { path: { id } } });
  return data!;
}

/** PUT /auto-reply-rules/{id} — Update auto reply rule */
export async function updateAutoReplyRule(
  id: string,
  body: OperationBody<'update_auto_reply_rule'>
) {
  const { data } = await coreClient().PUT('/auto-reply-rules/{id}', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** DELETE /auto-reply-rules/{id} — Delete auto reply rule */
export async function deleteAutoReplyRule(id: string) {
  await coreClient().DELETE('/auto-reply-rules/{id}', { params: { path: { id } } });
}

/** POST /auto-reply-rules/reorder — Persist rule priority order */
export async function reorderAutoReplyRules(body: OperationBody<'reorder_auto_reply_rules'>) {
  await coreClient().POST('/auto-reply-rules/reorder', { body });
}
