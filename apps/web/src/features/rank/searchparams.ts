import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the rank screens — spreads the shared parsers (scope, page, sort, q). */
export const rankSearchParams = { ...commonSearchParams };

export const rankSearchParamsCache = createSearchParamsCache(rankSearchParams);
