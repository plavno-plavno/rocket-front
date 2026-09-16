import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the review-generation screens — spreads the shared parsers (scope, page, sort, q). */
export const reviewGenerationSearchParams = { ...commonSearchParams };

export const reviewGenerationSearchParamsCache = createSearchParamsCache(
  reviewGenerationSearchParams
);
