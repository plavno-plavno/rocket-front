import { queryOptions } from '@tanstack/react-query';
import {
  listReviews,
  getReviewsSummary,
  getReview,
  listReviewVersions,
  listReviewReplies,
  listReviewNotes,
  listReviewComplaints,
  listReviewActivity
} from './service';
import type { ListReviewsQuery, GetReviewsSummaryQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const reviewsKeys = {
  all: ['reviews'] as const,
  reviews: (params?: ListReviewsQuery) =>
    [...reviewsKeys.all, 'reviews', params?.scope ?? 'all', params ?? {}] as const,
  reviewsSummary: (params?: GetReviewsSummaryQuery) =>
    [...reviewsKeys.all, 'reviewsSummary', params?.scope ?? 'all', params ?? {}] as const,
  review: (id: string) => [...reviewsKeys.all, 'review', id] as const,
  reviewVersions: (id: string) => [...reviewsKeys.all, 'reviewVersions', id] as const,
  reviewReplies: (id: string) => [...reviewsKeys.all, 'reviewReplies', id] as const,
  reviewNotes: (id: string) => [...reviewsKeys.all, 'reviewNotes', id] as const,
  reviewComplaints: (id: string) => [...reviewsKeys.all, 'reviewComplaints', id] as const,
  reviewActivity: (id: string) => [...reviewsKeys.all, 'reviewActivity', id] as const
};

export const reviewsQueryOptions = (params?: ListReviewsQuery) =>
  queryOptions({ queryKey: reviewsKeys.reviews(params), queryFn: () => listReviews(params) });

export const reviewsSummaryQueryOptions = (params?: GetReviewsSummaryQuery) =>
  queryOptions({
    queryKey: reviewsKeys.reviewsSummary(params),
    queryFn: () => getReviewsSummary(params)
  });

export const reviewQueryOptions = (id: string) =>
  queryOptions({ queryKey: reviewsKeys.review(id), queryFn: () => getReview(id) });

export const reviewVersionsQueryOptions = (id: string) =>
  queryOptions({ queryKey: reviewsKeys.reviewVersions(id), queryFn: () => listReviewVersions(id) });

export const reviewRepliesQueryOptions = (id: string) =>
  queryOptions({ queryKey: reviewsKeys.reviewReplies(id), queryFn: () => listReviewReplies(id) });

export const reviewNotesQueryOptions = (id: string) =>
  queryOptions({ queryKey: reviewsKeys.reviewNotes(id), queryFn: () => listReviewNotes(id) });

export const reviewComplaintsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: reviewsKeys.reviewComplaints(id),
    queryFn: () => listReviewComplaints(id)
  });

export const reviewActivityQueryOptions = (id: string) =>
  queryOptions({ queryKey: reviewsKeys.reviewActivity(id), queryFn: () => listReviewActivity(id) });
