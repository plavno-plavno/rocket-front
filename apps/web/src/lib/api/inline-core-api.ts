/**
 * In-process mock core-api for deployments without a core-api (Vercel demo), `MOCK_API_INLINE=true`.
 *
 * `src/instrumentation.ts` loads `mocks/inline.ts` once per server instance and registers it here;
 * `core-client` (server side) and the `/api/core/[...path]` route handler (browser side) both call
 * the same instance, so they share one in-memory dataset. Without the flag nothing is registered
 * and the app talks to `CORE_API_URL` as usual (`pnpm mock:api` in development).
 */

export type CoreApiFetch = (request: Request) => Promise<Response>;

/** Origin of requests handed to the inline mock; never resolved over the network. */
export const INLINE_CORE_API_URL = 'http://core-api.inline';

const KEY = Symbol.for('lp.inline-core-api');

export function isInlineCoreApiEnabled(): boolean {
  return process.env.MOCK_API_INLINE === 'true';
}

export function registerInlineCoreApi(fetch: CoreApiFetch) {
  (globalThis as Record<symbol, unknown>)[KEY] = fetch;
}

export function inlineCoreApi(): CoreApiFetch | undefined {
  return (globalThis as Record<symbol, CoreApiFetch | undefined>)[KEY];
}
