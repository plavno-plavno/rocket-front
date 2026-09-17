import type { Request, Response } from 'express';
import { compose } from '@/features/ai-replies/mocks/handlers';
import type { MockDb } from '@mocks/db';
import { readCookie, SESSION_COOKIE } from '@mocks/lib/http';

/**
 * `POST /ai-replies/generate` with `Accept: text/event-stream` → AI SDK UI message stream
 * (`text-start` / `text-delta` / `text-end`, then `[DONE]`) [H-UI-10]. JSON requests fall through
 * to the MSW handler.
 */
export function aiReplyStream(req: Request, res: Response, db: MockDb) {
  const token = readCookie(
    new Request('http://x', { headers: { cookie: req.headers.cookie ?? '' } }),
    SESSION_COOKIE
  );
  const session = token ? db.sessions.get(token) : undefined;
  if (!session) {
    res.status(401).type('application/problem+json').json({
      type: 'https://lp.example/problems/unauthenticated',
      title: 'Authentication required',
      status: 401,
      code: 'unauthenticated'
    });
    return;
  }
  const body = (req.body ?? {}) as {
    review_id?: string | null;
    profile_id?: string | null;
    sample_review?: { text?: string; rating?: number | null; location_name?: string };
  };
  const profile = db.aiProfiles.find((p) => p.id === body.profile_id) ?? db.aiProfiles[0];
  const review = body.review_id ? db.reviews.find((r) => r.id === body.review_id) : null;
  const text = compose(
    review?.text ?? body.sample_review?.text ?? null,
    review?.rating ?? body.sample_review?.rating ?? null,
    review?.location_name ?? body.sample_review?.location_name ?? 'наш магазин',
    review?.author.name ?? 'Гость',
    profile?.tone ?? 'friendly',
    profile?.signature ?? 'Команда'
  );

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-vercel-ai-ui-message-stream': 'v1',
    'x-accel-buffering': 'no'
  });
  const send = (chunk: Record<string, unknown> | string) =>
    res.write(`data: ${typeof chunk === 'string' ? chunk : JSON.stringify(chunk)}\n\n`);
  send({ type: 'start' });
  send({ type: 'text-start', id: 't1' });
  const words = text.split(/(?<=\s)/);
  const delay = Number(process.env.MOCK_STREAM_WORD_MS ?? 40);
  let i = 0;
  const timer = setInterval(() => {
    if (i < words.length) {
      send({ type: 'text-delta', id: 't1', delta: words[i++] });
      return;
    }
    clearInterval(timer);
    send({ type: 'text-end', id: 't1' });
    send({ type: 'finish' });
    send('[DONE]');
    res.end();
  }, delay);
  res.on('close', () => clearInterval(timer));
}
