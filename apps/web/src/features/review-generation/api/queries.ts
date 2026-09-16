import { queryOptions } from '@tanstack/react-query';
import { listReviewCampaigns, getReviewCampaign, getCampaignFunnel } from './service';
import type { ListReviewCampaignsQuery, GetCampaignFunnelQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const reviewGenerationKeys = {
  all: ['review-generation'] as const,
  reviewCampaigns: (params?: ListReviewCampaignsQuery) =>
    [...reviewGenerationKeys.all, 'reviewCampaigns', params ?? {}] as const,
  reviewCampaign: (id: string) => [...reviewGenerationKeys.all, 'reviewCampaign', id] as const,
  campaignFunnel: (id: string, params: GetCampaignFunnelQuery) =>
    [...reviewGenerationKeys.all, 'campaignFunnel', id, params ?? {}] as const
};

export const reviewCampaignsQueryOptions = (params?: ListReviewCampaignsQuery) =>
  queryOptions({
    queryKey: reviewGenerationKeys.reviewCampaigns(params),
    queryFn: () => listReviewCampaigns(params)
  });

export const reviewCampaignQueryOptions = (id: string) =>
  queryOptions({
    queryKey: reviewGenerationKeys.reviewCampaign(id),
    queryFn: () => getReviewCampaign(id)
  });

export const campaignFunnelQueryOptions = (id: string, params: GetCampaignFunnelQuery) =>
  queryOptions({
    queryKey: reviewGenerationKeys.campaignFunnel(id, params),
    queryFn: () => getCampaignFunnel(id, params)
  });
