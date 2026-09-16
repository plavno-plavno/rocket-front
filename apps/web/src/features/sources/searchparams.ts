import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the sources screens — spreads the shared parsers (scope, page, sort, q). */
export const sourcesSearchParams = { ...commonSearchParams };

export const sourcesSearchParamsCache = createSearchParamsCache(sourcesSearchParams);
