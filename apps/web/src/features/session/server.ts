import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getQueryClient } from '@/lib/query-client';
import { isApiError } from '@/lib/api';
import { checkAccess } from '@/lib/permissions';
import type { PermissionCheck } from '@/types';
import { meQueryOptions } from './api/queries';
import { getMe } from './api/service';

/**
 * `/me` for server components, memoised per request. Redirects to sign-in on 401.
 * The same data is prefetched into the query client in `app/dashboard/layout.tsx`
 * so client components hydrate without a second round-trip.
 */
export const getMeServer = cache(async () => {
  try {
    return await getMe();
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      const path = (await headers()).get('x-pathname') ?? '/dashboard/overview';
      redirect(`/auth/sign-in?next=${encodeURIComponent(path)}&expired=1`);
    }
    throw error;
  }
});

/** Prefetches `/me` into the request-scoped query client (call once in the dashboard layout). */
export async function prefetchMe() {
  const queryClient = getQueryClient();
  const me = await getMeServer();
  queryClient.setQueryData(meQueryOptions().queryKey, me);
  return { queryClient, me };
}

/**
 * Server-side access check for pages (SDD-01 §2.2): returns `true` or `false` so the page can
 * render `<PageContainer access={false} />`. UX only — core-api is the authority.
 */
export async function requireAccess(check?: PermissionCheck): Promise<boolean> {
  const me = await getMeServer();
  return checkAccess(me, check);
}
