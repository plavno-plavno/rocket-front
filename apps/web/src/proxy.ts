import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'lp_session';

/**
 * Session gate (SDD-01 §2.2): `/dashboard/**` requires the session cookie; otherwise redirect
 * to sign-in with `next=`. Cookie presence only — core-api validates the session on `/me`
 * (401 → redirect handled by core-client / getMeServer).
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;

  if (pathname.startsWith('/dashboard') && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (pathname === '/auth/sign-in' && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard/overview';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Expose the pathname to server components (used by getMeServer for the `next` param).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/sign-in']
};
