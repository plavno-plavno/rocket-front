/**
 * Mock core-api as a plain `(Request) => Response` function, for deployments without a separate
 * mock server (Vercel demo, `MOCK_API_INLINE=true`). Registered by `src/instrumentation.ts`, see
 * `src/lib/api/inline-core-api.ts`. Local development keeps using `pnpm mock:api` (server.ts).
 *
 * Differences from server.ts:
 * - State lives in the memory of one serverless instance: it resets on a cold start and is not
 *   shared between instances. The session cookie therefore also carries the user and tenant ids
 *   so that an instance that never saw the sign-in restores the session (demo data only).
 * - `/reviews/stream` closes itself after STREAM_MAX_MS (function time limit); EventSource
 *   reconnects on its own. `/ai-replies/generate` streams are web streams too (lib/ai-stream.ts).
 * - Unknown routes answer 404 without the OpenAPI lookup; `/__mock/*` endpoints are not served.
 */
import { getResponse } from 'msw';
import { compose } from '@/features/ai-replies/mocks/handlers';
import { featureHandlers } from '@/generated/mock-registry';
import { dbFor, type MockDb } from './db';
import { currentSession, nowIso, problem, readCookie, unauthenticated } from './lib/http';
import { ingestSyntheticReview } from './lib/review-stream';
import { serializeSessionCookie, SESSION_COOKIE, SESSION_HEADER } from './lib/session-cookie';

const STREAM_MAX_MS = 50_000;

export async function inlineCoreApiFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const db = dbFor(request);
  restoreSession(request, db);
  try {
    // Download stub for finished exports, as in server.ts (`Export.download_url`).
    if (request.method === 'GET' && url.pathname.startsWith('/__mock/exports/')) {
      const file = url.pathname
        .split('/')
        .pop()!
        .replace(/\.xlsx$/, '.csv');
      return new Response(
        '\uFEFFКод филиала;Название;Город\n100;Спортэксперт, ТРК Жемчужная Плаза;Москва\n',
        {
          headers: {
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': `attachment; filename="${file}"`
          }
        }
      );
    }
    if (request.method === 'GET' && url.pathname === '/reviews/stream') {
      return reviewStream(request, db);
    }
    if (
      request.method === 'POST' &&
      url.pathname === '/ai-replies/generate' &&
      (request.headers.get('accept') ?? '').includes('text/event-stream')
    ) {
      return aiReplyStream(request, db);
    }
    const response = await getResponse(featureHandlers, request, { baseUrl: url.origin });
    if (!response) {
      return problem(404, 'not_found', 'Not found', `${request.method} ${url.pathname}`);
    }
    return withSessionCookie(db, response);
  } catch (error) {
    return problem(500, 'internal', 'Mock handler failed', String(error));
  }
}

/** Session token as issued by the handlers → `token~userId~tenantId` (see header comment). */
function portableToken(db: MockDb, token: string): string {
  const session = token ? db.sessions.get(token) : undefined;
  if (!session) return token;
  const portable = [token, session.userId, session.tenantId].join('~');
  db.sessions.delete(token);
  db.sessions.set(portable, { ...session, token: portable });
  return portable;
}

function restoreSession(request: Request, db: MockDb) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || db.sessions.has(token)) return;
  const [, userId, tenantId] = token.split('~');
  if (!userId || !tenantId || !db.users.some((u) => u.id === userId)) return;
  db.sessions.set(token, { token, userId, tenantId, createdAt: nowIso() });
}

/** Same translation as the express layer in server.ts: SESSION_HEADER → Set-Cookie. */
function withSessionCookie(db: MockDb, response: Response): Response {
  const token = response.headers.get(SESSION_HEADER);
  if (token === null) return response;
  const headers = new Headers(response.headers);
  headers.delete(SESSION_HEADER);
  headers.append('set-cookie', serializeSessionCookie(portableToken(db, token)));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/** Web-stream variant of lib/review-stream.ts. */
function reviewStream(request: Request, db: MockDb): Response {
  if (!currentSession(request, db)) return unauthenticated();
  const encoder = new TextEncoder();
  let stop: (() => void) | undefined;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          stop?.();
        }
      };
      const heartbeat = setInterval(() => send(': ping\n\n'), 25_000);
      const producer =
        process.env.MOCK_STREAM === '0'
          ? undefined
          : setInterval(
              () => {
                const event = ingestSyntheticReview(db);
                if (event) send(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
              },
              Number(process.env.MOCK_STREAM_INTERVAL_MS ?? 20_000)
            );
      const deadline = setTimeout(() => stop?.(), STREAM_MAX_MS);
      const onAbort = () => stop?.();
      stop = () => {
        stop = undefined;
        clearInterval(heartbeat);
        clearInterval(producer);
        clearTimeout(deadline);
        request.signal.removeEventListener('abort', onAbort);
        try {
          controller.close();
        } catch {
          // already closed or cancelled
        }
      };
      request.signal.addEventListener('abort', onAbort);
      send(': connected\n\n');
    },
    cancel() {
      stop?.();
    }
  });
  return new Response(body, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no'
    }
  });
}

/** Web-stream variant of lib/ai-stream.ts (AI SDK UI message stream). */
async function aiReplyStream(request: Request, db: MockDb): Promise<Response> {
  if (!currentSession(request, db)) return unauthenticated();
  const body = (await request.json().catch(() => ({}))) as {
    review_id?: string | null;
    profile_id?: string | null;
    sample_review?: { text?: string; rating?: number | null; location_name?: string };
  };
  const profile = db.aiProfiles.find((p) => p.id === body.profile_id) ?? db.aiProfiles[0];
  const review = body.review_id ? db.reviews.find((r) => r.id === body.review_id) : null;
  const words = compose(
    review?.text ?? body.sample_review?.text ?? null,
    review?.rating ?? body.sample_review?.rating ?? null,
    review?.location_name ?? body.sample_review?.location_name ?? 'наш магазин',
    review?.author.name ?? 'Гость',
    profile?.tone ?? 'friendly',
    profile?.signature ?? 'Команда'
  ).split(/(?<=\s)/);
  const delay = Number(process.env.MOCK_STREAM_WORD_MS ?? 40);
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: Record<string, unknown> | string) =>
        controller.enqueue(
          encoder.encode(`data: ${typeof chunk === 'string' ? chunk : JSON.stringify(chunk)}\n\n`)
        );
      send({ type: 'start' });
      send({ type: 'text-start', id: 't1' });
      let i = 0;
      timer = setInterval(() => {
        if (i < words.length) {
          send({ type: 'text-delta', id: 't1', delta: words[i++] });
          return;
        }
        clearInterval(timer);
        send({ type: 'text-end', id: 't1' });
        send({ type: 'finish' });
        send('[DONE]');
        controller.close();
      }, delay);
    },
    cancel() {
      clearInterval(timer);
    }
  });
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-vercel-ai-ui-message-stream': 'v1'
    }
  });
}
