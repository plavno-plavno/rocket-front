import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the notifications screens — spreads the shared parsers (scope, page, sort, q). */
export const notificationsSearchParams = { ...commonSearchParams };

export const notificationsSearchParamsCache = createSearchParamsCache(notificationsSearchParams);
