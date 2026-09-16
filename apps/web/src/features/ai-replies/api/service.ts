import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListAiReplyProfilesQuery } from './types';

/** GET /ai-reply-profiles — List ai reply profiles */
export async function listAiReplyProfiles(params?: ListAiReplyProfilesQuery) {
  const { data } = await coreClient().GET('/ai-reply-profiles', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /ai-reply-profiles — Create ai reply profile */
export async function createAiReplyProfile(body: OperationBody<'create_ai_reply_profile'>) {
  const { data } = await coreClient().POST('/ai-reply-profiles', { body });
  return data!;
}

/** GET /ai-reply-profiles/{id} — Get ai reply profile */
export async function getAiReplyProfile(id: string) {
  const { data } = await coreClient().GET('/ai-reply-profiles/{id}', { params: { path: { id } } });
  return data!;
}

/** PUT /ai-reply-profiles/{id} — Update ai reply profile */
export async function updateAiReplyProfile(
  id: string,
  body: OperationBody<'update_ai_reply_profile'>
) {
  const { data } = await coreClient().PUT('/ai-reply-profiles/{id}', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** DELETE /ai-reply-profiles/{id} — Delete ai reply profile */
export async function deleteAiReplyProfile(id: string) {
  await coreClient().DELETE('/ai-reply-profiles/{id}', { params: { path: { id } } });
}

/** POST /ai-replies/generate — Generate reply variants (stream when Accept: text/event-stream) */
export async function generateAiReply(body: OperationBody<'generate_ai_reply'>) {
  const { data } = await coreClient().POST('/ai-replies/generate', { body });
  return data!;
}
