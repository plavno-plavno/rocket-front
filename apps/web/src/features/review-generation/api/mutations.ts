import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { reviewGenerationKeys } from './queries';
import {
  createReviewCampaign,
  updateReviewCampaign,
  deleteReviewCampaign,
  sendCampaignBatch,
  exportQrPdf
} from './service';

export const createReviewCampaignMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewGenerationKeys.all, 'create_review_campaign'],
    mutationFn: ({ body }: { body: Parameters<typeof createReviewCampaign>[0] }) =>
      createReviewCampaign(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewGenerationKeys.all })
  });

export const updateReviewCampaignMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewGenerationKeys.all, 'update_review_campaign'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateReviewCampaign>[1] }) =>
      updateReviewCampaign(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewGenerationKeys.all })
  });

export const deleteReviewCampaignMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewGenerationKeys.all, 'delete_review_campaign'],
    mutationFn: ({ id }: { id: string }) => deleteReviewCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewGenerationKeys.all })
  });

export const sendCampaignBatchMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewGenerationKeys.all, 'send_campaign_batch'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof sendCampaignBatch>[1] }) =>
      sendCampaignBatch(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewGenerationKeys.all })
  });

export const exportQrPdfMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewGenerationKeys.all, 'export_qr_pdf'],
    mutationFn: ({ body }: { body: Parameters<typeof exportQrPdf>[0] }) => exportQrPdf(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewGenerationKeys.all })
  });
