import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from '@lp/contracts';
import { ApiError, type Problem } from './errors';
import { INLINE_CORE_API_URL, inlineCoreApi } from './inline-core-api';

/**
 * Typed HTTP client for core-api (SDD-01 §5.1).
 *
 * - On the server (RSC prefetch, route handlers) it talks to `CORE_API_URL`
 *   directly and forwards the session cookie + `x-request-id` of the incoming request.
 * - In the browser it talks to `/api/core` — a Next.js rewrite to core-api — so the
 *   session cookie is same-origin.
 * - With `MOCK_API_INLINE=true` (Vercel demo) the server side calls the in-process mock instead,
 *   see `inline-core-api.ts`.
 * - Every non-2xx response becomes an `ApiError`; a 401 in the browser redirects to sign-in.
 *
 * Only `features/<f>/api/service.ts` files may import this module.
 */

const isServer = typeof window === 'undefined';

const BROWSER_BASE_URL = '/api/core';

function serverBaseUrl(): string {
  if (inlineCoreApi()) return INLINE_CORE_API_URL;
  const url = process.env.CORE_API_URL;
  if (!url) throw new Error('CORE_API_URL is not set (server-side core-client)');
  return url.replace(/\/$/, '');
}

const forwardRequestContext: Middleware = {
  async onRequest({ request }) {
    if (!isServer) return request;
    // Imported lazily: `next/headers` is server-only and throws outside a request scope.
    const { headers, cookies } = await import('next/headers');
    try {
      const [h, c] = await Promise.all([headers(), cookies()]);
      const cookieHeader = c.toString();
      if (cookieHeader) request.headers.set('cookie', cookieHeader);
      const requestId = h.get('x-request-id');
      if (requestId) request.headers.set('x-request-id', requestId);
    } catch {
      // Called outside a request scope (e.g. scripts) — nothing to forward.
    }
    return request;
  }
};

const throwOnError: Middleware = {
  async onResponse({ request, response }) {
    if (response.ok && (response.headers.get('content-type') ?? '').includes('text/html')) {
      // `/api/core` served a Next page instead of core-api (misconfigured proxy) — fail with a
      // gateway error rather than a JSON SyntaxError on '<!DOCTYPE'.
      throw new ApiError(502, {
        type: 'https://lp.example/problems/bad_gateway',
        title: 'core-api returned an HTML page instead of JSON',
        status: 502,
        code: 'bad_gateway',
        detail: `${request.method} ${new URL(request.url).pathname}`
      });
    }
    if (response.ok) return response;
    let problem: Problem | undefined;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('json')) {
      try {
        problem = (await response.clone().json()) as Problem;
      } catch {
        problem = undefined;
      }
    }
    const error = new ApiError(
      response.status,
      problem,
      response.headers.get('x-request-id') ?? undefined
    );
    if (!isServer && response.status === 401) redirectToSignIn();
    throw error;
  }
};

function redirectToSignIn() {
  if (window.location.pathname.startsWith('/auth')) return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/auth/sign-in?next=${next}`);
}

function createCoreClient() {
  const client = createClient<paths>({
    baseUrl: isServer ? serverBaseUrl() : BROWSER_BASE_URL,
    fetch: isServer ? inlineCoreApi() : undefined,
    credentials: 'include',
    headers: { accept: 'application/json' }
  });
  client.use(forwardRequestContext);
  client.use(throwOnError);
  return client;
}

let browserClient: ReturnType<typeof createCoreClient> | undefined;

/**
 * Returns the core-api client. On the server a fresh client is created per call so that
 * the request context (cookie, request id) is always the current one.
 */
export function coreClient() {
  if (isServer) return createCoreClient();
  browserClient ??= createCoreClient();
  return browserClient;
}

export type CoreClient = ReturnType<typeof createCoreClient>;

/**
 * Serialises `filter[field]=value` query params the way core-api expects (SDD-00 §8).
 * openapi-fetch already handles arrays as repeated keys; nothing else is needed here,
 * the helper only documents the convention and strips `undefined`.
 */
export function query<T extends Record<string, unknown>>(params: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

export { ApiError, isApiError } from './errors';
