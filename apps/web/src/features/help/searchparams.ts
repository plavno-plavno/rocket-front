import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the help screens — spreads the shared parsers (scope, page, sort, q). */
export const helpSearchParams = { ...commonSearchParams };

export const helpSearchParamsCache = createSearchParamsCache(helpSearchParams);
