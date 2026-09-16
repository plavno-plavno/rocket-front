import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListConversationsQuery, ListConversationMessagesQuery } from './types';

/** GET /conversations — Multichat threads [H-UI-05] */
export async function listConversations(params?: ListConversationsQuery) {
  const { data } = await coreClient().GET('/conversations', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** GET /conversations/{id} — Thread */
export async function getConversation(id: string) {
  const { data } = await coreClient().GET('/conversations/{id}', { params: { path: { id } } });
  return data!;
}

/** PATCH /conversations/{id} — Close / assign thread */
export async function updateConversation(id: string, body: OperationBody<'update_conversation'>) {
  const { data } = await coreClient().PATCH('/conversations/{id}', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** GET /conversations/{id}/messages — Messages */
export async function listConversationMessages(id: string, params?: ListConversationMessagesQuery) {
  const { data } = await coreClient().GET('/conversations/{id}/messages', {
    params: { path: { id }, query: query(params ?? {}) }
  });
  return data!;
}

/** POST /conversations/{id}/messages — Send a message */
export async function sendConversationMessage(
  id: string,
  body: OperationBody<'send_conversation_message'>
) {
  const { data } = await coreClient().POST('/conversations/{id}/messages', {
    params: { path: { id } },
    body
  });
  return data!;
}
