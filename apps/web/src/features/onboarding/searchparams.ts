import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the onboarding screens — spreads the shared parsers (scope, page, sort, q). */
export const onboardingSearchParams = { ...commonSearchParams };

export const onboardingSearchParamsCache = createSearchParamsCache(onboardingSearchParams);
