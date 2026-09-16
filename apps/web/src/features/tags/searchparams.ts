import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the tags screens — spreads the shared parsers (scope, page, sort, q). */
export const tagsSearchParams = { ...commonSearchParams };

export const tagsSearchParamsCache = createSearchParamsCache(tagsSearchParams);
