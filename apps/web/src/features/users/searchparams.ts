import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the users screens — spreads the shared parsers (scope, page, sort, q). */
export const usersSearchParams = { ...commonSearchParams };

export const usersSearchParamsCache = createSearchParamsCache(usersSearchParams);
