import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the questions screens — spreads the shared parsers (scope, page, sort, q). */
export const questionsSearchParams = { ...commonSearchParams };

export const questionsSearchParamsCache = createSearchParamsCache(questionsSearchParams);
