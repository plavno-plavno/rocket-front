'use client';

import { useEffect } from 'react';
import { TIMEZONE_COOKIE } from '@/lib/i18n';
import { setTimeZoneAction } from '@/lib/i18n/actions';
import { useMe } from '../hooks/use-me';

/**
 * Mirrors `tenant.timezone` into a cookie so server-rendered dates use the tenant zone
 * (SDD-01 §3.3). Rendered once inside the dashboard layout.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const me = useMe();
  useEffect(() => {
    const current = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${TIMEZONE_COOKIE}=`))
      ?.split('=')[1];
    if (current !== me.tenant.timezone) void setTimeZoneAction(me.tenant.timezone);
  }, [me.tenant.timezone]);
  return <>{children}</>;
}
