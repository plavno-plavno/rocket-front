import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { reviewsKeys } from './queries';
import {
  createManualReview,
  exportReviews,
  updateReview,
  createReviewReply,
  updateReviewReply,
  deleteReviewReply,
  createReviewNote,
  deleteReviewNote,
  createReviewComplaint
} from './service';

export const createManualReviewMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewsKeys.all, 'create_manual_review'],
    mutationFn: ({ body }: { body: Parameters<typeof createManualReview>[0] }) =>
      createManualReview(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.all })
  });

export const exportReviewsMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewsKeys.all, 'export_reviews'],
    mutationFn: ({
      body,
      params
    }: {
      body: Parameters<typeof exportReviews>[0];
      params?: Parameters<typeof exportReviews>[1];
    }) => exportReviews(body, params),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.all })
  });

export const updateReviewMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewsKeys.all, 'update_review'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateReview>[1] }) =>
      updateReview(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.all })
  });

export const createReviewReplyMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewsKeys.all, 'create_review_reply'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof createReviewReply>[1] }) =>
      createReviewReply(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.all })
  });

export const updateReviewReplyMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewsKeys.all, 'update_review_reply'],
    mutationFn: ({
      id,
      replyId,
      body
    }: {
      id: string;
      replyId: string;
      body: Parameters<typeof updateReviewReply>[2];
    }) => updateReviewReply(id, replyId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.all })
  });

export const deleteReviewReplyMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewsKeys.all, 'delete_review_reply'],
    mutationFn: ({ id, replyId }: { id: string; replyId: string }) =>
      deleteReviewReply(id, replyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.all })
  });

export const createReviewNoteMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewsKeys.all, 'create_review_note'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof createReviewNote>[1] }) =>
      createReviewNote(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.all })
  });

export const deleteReviewNoteMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewsKeys.all, 'delete_review_note'],
    mutationFn: ({ id, noteId }: { id: string; noteId: string }) => deleteReviewNote(id, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.all })
  });

export const createReviewComplaintMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewsKeys.all, 'create_review_complaint'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof createReviewComplaint>[1] }) =>
      createReviewComplaint(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.all })
  });
