import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the reviews screens — spreads the shared parsers (scope, page, sort, q). */
export const reviewsSearchParams = { ...commonSearchParams };

export const reviewsSearchParamsCache = createSearchParamsCache(reviewsSearchParams);
