import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the listings screens — spreads the shared parsers (scope, page, sort, q). */
export const listingsSearchParams = { ...commonSearchParams };

export const listingsSearchParamsCache = createSearchParamsCache(listingsSearchParams);
