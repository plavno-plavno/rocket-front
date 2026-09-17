import { INLINE_CORE_API_URL, inlineCoreApi } from '@/lib/api/inline-core-api';

/**
 * `/api/core/*` for `MOCK_API_INLINE=true` (Vercel demo): forwards to the in-process mock core-api.
 * Normally this route is never reached — the `/api/core/:path*` rewrite in next.config.ts runs
 * before dynamic routes and proxies to `CORE_API_URL`; next.config.ts drops it in inline mode.
 */

export const dynamic = 'force-dynamic';
// `/reviews/stream` is long-lived; mocks/inline.ts closes it before this limit.
export const maxDuration = 60;

async function handle(request: Request): Promise<Response> {
  const coreApi = inlineCoreApi();
  if (!coreApi) return new Response(null, { status: 404 });
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/core/, '') || '/';
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return coreApi(
    new Request(`${INLINE_CORE_API_URL}${path}${url.search}`, {
      method: request.method,
      headers: request.headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: request.signal
    })
  );
}

export { handle as DELETE, handle as GET, handle as PATCH, handle as POST, handle as PUT };
