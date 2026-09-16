import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the presence screens — spreads the shared parsers (scope, page, sort, q). */
export const presenceSearchParams = { ...commonSearchParams };

export const presenceSearchParamsCache = createSearchParamsCache(presenceSearchParams);
