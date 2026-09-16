import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the ai-replies screens — spreads the shared parsers (scope, page, sort, q). */
export const aiRepliesSearchParams = { ...commonSearchParams };

export const aiRepliesSearchParamsCache = createSearchParamsCache(aiRepliesSearchParams);
