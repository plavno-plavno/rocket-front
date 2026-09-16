import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the duplicates screens — spreads the shared parsers (scope, page, sort, q). */
export const duplicatesSearchParams = { ...commonSearchParams };

export const duplicatesSearchParamsCache = createSearchParamsCache(duplicatesSearchParams);
