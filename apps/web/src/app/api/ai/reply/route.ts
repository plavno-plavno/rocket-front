import { cookies, headers } from 'next/headers';
import { INLINE_CORE_API_URL, inlineCoreApi } from '@/lib/api/inline-core-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Streams `/ai-replies/generate` from core-api to the browser [H-UI-10]. The UI message stream
 * (`x-vercel-ai-ui-message-stream: v1`) is passed through untouched, so `useCompletion` /
 * `useChat` consume it directly; the session cookie is forwarded server-side. With
 * `MOCK_API_INLINE=true` (Vercel demo) core-api is the in-process mock (lib/api/inline-core-api.ts).
 */
export async function POST(req: Request) {
  const inline = inlineCoreApi();
  const base = inline ? INLINE_CORE_API_URL : process.env.CORE_API_URL;
  if (!base) return Response.json({ title: 'CORE_API_URL is not set' }, { status: 500 });
  const [h, c] = await Promise.all([headers(), cookies()]);
  const body = await req.text();
  const request = new Request(`${base}/ai-replies/generate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
      cookie: c.toString(),
      ...(h.get('x-request-id') ? { 'x-request-id': h.get('x-request-id')! } : {})
    },
    body,
    signal: req.signal
  });
  const upstream = await (inline ? inline(request) : fetch(request));
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return new Response(text || upstream.statusText, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'text/plain' }
    });
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-vercel-ai-ui-message-stream': 'v1'
    }
  });
}
