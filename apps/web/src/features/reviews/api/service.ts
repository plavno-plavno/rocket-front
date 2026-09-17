import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListReviewsQuery, GetReviewsSummaryQuery, ExportReviewsQuery } from './types';

/** GET /reviews — Inbox list */
export async function listReviews(params?: ListReviewsQuery) {
  const { data } = await coreClient().GET('/reviews', { params: { query: query(params ?? {}) } });
  return data!;
}

/** POST /reviews — Add a review manually [H-UI-06] */
export async function createManualReview(body: OperationBody<'create_manual_review'>) {
  const { data } = await coreClient().POST('/reviews', { body });
  return data!;
}

/** GET /reviews/summary — KPI row of the inbox */
export async function getReviewsSummary(params?: GetReviewsSummaryQuery) {
  const { data } = await coreClient().GET('/reviews/summary', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /reviews/export — Export reviews (async) */
export async function exportReviews(
  body: OperationBody<'export_reviews'>,
  params?: ExportReviewsQuery
) {
  const { data } = await coreClient().POST('/reviews/export', {
    params: { query: query(params ?? {}) },
    body
  });
  return data!;
}

/** GET /reviews/{id} — Review */
export async function getReview(id: string) {
  const { data } = await coreClient().GET('/reviews/{id}', { params: { path: { id } } });
  return data!;
}

/** PATCH /reviews/{id} — Update workflow status, assignee, tags */
export async function updateReview(id: string, body: OperationBody<'update_review'>) {
  const { data } = await coreClient().PATCH('/reviews/{id}', { params: { path: { id } }, body });
  return data!;
}

/** GET /reviews/{id}/versions — Versions of an edited review */
export async function listReviewVersions(id: string) {
  const { data } = await coreClient().GET('/reviews/{id}/versions', { params: { path: { id } } });
  return data!;
}

/** GET /reviews/{id}/replies — Replies */
export async function listReviewReplies(id: string) {
  const { data } = await coreClient().GET('/reviews/{id}/replies', { params: { path: { id } } });
  return data!;
}

/** POST /reviews/{id}/replies — Reply (publish or save draft) */
export async function createReviewReply(id: string, body: OperationBody<'create_review_reply'>) {
  const { data } = await coreClient().POST('/reviews/{id}/replies', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** PATCH /reviews/{id}/replies/{replyId} — Edit a reply */
export async function updateReviewReply(
  id: string,
  replyId: string,
  body: OperationBody<'update_review_reply'>
) {
  const { data } = await coreClient().PATCH('/reviews/{id}/replies/{replyId}', {
    params: { path: { id, replyId } },
    body
  });
  return data!;
}

/** DELETE /reviews/{id}/replies/{replyId} — Delete a reply (409 if the platform forbids it) */
export async function deleteReviewReply(id: string, replyId: string) {
  await coreClient().DELETE('/reviews/{id}/replies/{replyId}', {
    params: { path: { id, replyId } }
  });
}

/** GET /reviews/{id}/notes — Internal notes */
export async function listReviewNotes(id: string) {
  const { data } = await coreClient().GET('/reviews/{id}/notes', { params: { path: { id } } });
  return data!;
}

/** POST /reviews/{id}/notes — Add a note */
export async function createReviewNote(id: string, body: OperationBody<'create_review_note'>) {
  const { data } = await coreClient().POST('/reviews/{id}/notes', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** DELETE /reviews/{id}/notes/{noteId} — Delete a note */
export async function deleteReviewNote(id: string, noteId: string) {
  await coreClient().DELETE('/reviews/{id}/notes/{noteId}', { params: { path: { id, noteId } } });
}

/** GET /reviews/{id}/complaints — Complaints */
export async function listReviewComplaints(id: string) {
  const { data } = await coreClient().GET('/reviews/{id}/complaints', { params: { path: { id } } });
  return data!;
}

/** POST /reviews/{id}/complaints — File a complaint to the platform */
export async function createReviewComplaint(
  id: string,
  body: OperationBody<'create_review_complaint'>
) {
  const { data } = await coreClient().POST('/reviews/{id}/complaints', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** GET /reviews/{id}/activity — Activity history */
export async function listReviewActivity(id: string) {
  const { data } = await coreClient().GET('/reviews/{id}/activity', { params: { path: { id } } });
  return data!;
}

export async function getExport(id: string) {
  const { data } = await coreClient().GET('/exports/{id}', { params: { path: { id } } });
  return data!;
}
