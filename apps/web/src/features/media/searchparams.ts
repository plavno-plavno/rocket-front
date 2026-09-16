import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the media screens — spreads the shared parsers (scope, page, sort, q). */
export const mediaSearchParams = { ...commonSearchParams };

export const mediaSearchParamsCache = createSearchParamsCache(mediaSearchParams);
