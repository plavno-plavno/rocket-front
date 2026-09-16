import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListReviewCampaignsQuery, GetCampaignFunnelQuery } from './types';

/** GET /review-campaigns — List review campaigns */
export async function listReviewCampaigns(params?: ListReviewCampaignsQuery) {
  const { data } = await coreClient().GET('/review-campaigns', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /review-campaigns — Create review campaign */
export async function createReviewCampaign(body: OperationBody<'create_review_campaign'>) {
  const { data } = await coreClient().POST('/review-campaigns', { body });
  return data!;
}

/** GET /review-campaigns/{id} — Get review campaign */
export async function getReviewCampaign(id: string) {
  const { data } = await coreClient().GET('/review-campaigns/{id}', { params: { path: { id } } });
  return data!;
}

/** PUT /review-campaigns/{id} — Update review campaign */
export async function updateReviewCampaign(
  id: string,
  body: OperationBody<'update_review_campaign'>
) {
  const { data } = await coreClient().PUT('/review-campaigns/{id}', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** DELETE /review-campaigns/{id} — Delete review campaign */
export async function deleteReviewCampaign(id: string) {
  await coreClient().DELETE('/review-campaigns/{id}', { params: { path: { id } } });
}

/** GET /review-campaigns/{id}/funnel — Funnel by day */
export async function getCampaignFunnel(id: string, params: GetCampaignFunnelQuery) {
  const { data } = await coreClient().GET('/review-campaigns/{id}/funnel', {
    params: { path: { id }, query: query(params ?? {}) }
  });
  return data!;
}

/** POST /review-campaigns/{id}/send — Send requests to recipients (sms / whatsapp / email) */
export async function sendCampaignBatch(id: string, body: OperationBody<'send_campaign_batch'>) {
  const { data } = await coreClient().POST('/review-campaigns/{id}/send', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** POST /review-campaigns/qr-export — Generate QR PDF per location (async) */
export async function exportQrPdf(body: OperationBody<'export_qr_pdf'>) {
  const { data } = await coreClient().POST('/review-campaigns/qr-export', { body });
  return data!;
}
