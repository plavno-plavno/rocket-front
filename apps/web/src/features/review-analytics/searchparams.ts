import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the review-analytics screens — spreads the shared parsers (scope, page, sort, q). */
export const reviewAnalyticsSearchParams = { ...commonSearchParams };

export const reviewAnalyticsSearchParamsCache = createSearchParamsCache(
  reviewAnalyticsSearchParams
);
