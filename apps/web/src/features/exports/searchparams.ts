import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the exports screens — spreads the shared parsers (scope, page, sort, q). */
export const exportsSearchParams = { ...commonSearchParams };

export const exportsSearchParamsCache = createSearchParamsCache(exportsSearchParams);
