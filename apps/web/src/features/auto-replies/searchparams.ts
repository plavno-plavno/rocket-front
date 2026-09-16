import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the auto-replies screens — spreads the shared parsers (scope, page, sort, q). */
export const autoRepliesSearchParams = { ...commonSearchParams };

export const autoRepliesSearchParamsCache = createSearchParamsCache(autoRepliesSearchParams);
