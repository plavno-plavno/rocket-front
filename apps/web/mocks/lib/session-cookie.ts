export const SESSION_COOKIE = 'lp_session';

/**
 * Handlers must not emit `Set-Cookie` themselves: MSW stores mocked cookies in its own jar and
 * re-attaches them to later requests, which would make every request look authenticated.
 * Instead they set this header and the express layer (mocks/server.ts) turns it into `Set-Cookie`.
 */
export const SESSION_HEADER = 'x-mock-session';

export function serializeSessionCookie(token: string): string {
  const clear = token === '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 2_592_000}`;
}
