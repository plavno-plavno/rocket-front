import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the session screens — spreads the shared parsers (scope, page, sort, q). */
export const sessionSearchParams = { ...commonSearchParams };

export const sessionSearchParamsCache = createSearchParamsCache(sessionSearchParams);
