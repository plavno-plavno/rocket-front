import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListQuestionsQuery } from './types';

/** GET /questions — Questions inbox */
export async function listQuestions(params?: ListQuestionsQuery) {
  const { data } = await coreClient().GET('/questions', { params: { query: query(params ?? {}) } });
  return data!;
}

/** GET /questions/{id} — Question */
export async function getQuestion(id: string) {
  const { data } = await coreClient().GET('/questions/{id}', { params: { path: { id } } });
  return data!;
}

/** PATCH /questions/{id} — Update status / assignee */
export async function updateQuestion(id: string, body: OperationBody<'update_question'>) {
  const { data } = await coreClient().PATCH('/questions/{id}', { params: { path: { id } }, body });
  return data!;
}

/** GET /questions/{id}/answers — Answers */
export async function listAnswers(id: string) {
  const { data } = await coreClient().GET('/questions/{id}/answers', { params: { path: { id } } });
  return data!;
}

/** POST /questions/{id}/answers — Answer a question */
export async function createAnswer(id: string, body: OperationBody<'create_answer'>) {
  const { data } = await coreClient().POST('/questions/{id}/answers', {
    params: { path: { id } },
    body
  });
  return data!;
}
