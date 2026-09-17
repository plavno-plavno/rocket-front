import type { Request, Response } from 'express';
import type { Schema } from '@lp/contracts';
import { AUTHORS, REVIEW_NEGATIVE, REVIEW_POSITIVE } from '../db/text';
import type { MockDb } from '../db/types';
import { newId, nowIso, readCookie, SESSION_COOKIE } from './http';

/**
 * `GET /reviews/stream` — Server-Sent Events (SDD-01 §5.2). Every ~20 s a synthetic review is
 * ingested into the dataset and pushed as `review.ingested`; heartbeats keep proxies alive.
 * Disable with MOCK_STREAM=0.
 */
export function reviewStream(req: Request, res: Response, db: MockDb) {
  const token = readCookie(
    new Request('http://x', { headers: { cookie: req.headers.cookie ?? '' } }),
    SESSION_COOKIE
  );
  if (!token || !db.sessions.has(token)) {
    res.status(401).type('application/problem+json').json({
      type: 'https://lp.example/problems/unauthenticated',
      title: 'Authentication required',
      status: 401,
      code: 'unauthenticated'
    });
    return;
  }
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });
  res.write(': connected\n\n');

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);
  const intervalMs = Number(process.env.MOCK_STREAM_INTERVAL_MS ?? 20_000);
  const producer =
    process.env.MOCK_STREAM === '0'
      ? null
      : setInterval(() => {
          const event = ingestSyntheticReview(db);
          if (event) res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
        }, intervalMs);

  req.on('close', () => {
    clearInterval(heartbeat);
    if (producer) clearInterval(producer);
  });
}

export function ingestSyntheticReview(db: MockDb): Schema<'ReviewStreamEvent'> | null {
  const listings = db.listings.filter(
    (l) =>
      ['plt_google', 'plt_yandex', 'plt_2gis'].includes(l.platform_id) &&
      l.sync_status !== 'not_connected'
  );
  if (!listings.length) return null;
  const listing = listings[Math.floor(Math.random() * listings.length)];
  const location = db.locations.find((l) => l.id === listing.location_id);
  if (!location) return null;
  const negative = Math.random() < 0.3;
  const rating = negative ? 1 + Math.floor(Math.random() * 2) : 4 + Math.floor(Math.random() * 2);
  const now = nowIso();
  const review: Schema<'Review'> = {
    id: newId('rev'),
    listing_id: listing.id,
    location_id: location.id,
    location_name: location.name,
    platform_id: listing.platform_id,
    external_id: `live-${Date.now()}`,
    url: listing.url ? `${listing.url}/reviews/live` : null,
    author: {
      name: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
      external_id: null,
      avatar_url: null
    },
    rating,
    text: negative
      ? REVIEW_NEGATIVE[Math.floor(Math.random() * REVIEW_NEGATIVE.length)]
      : REVIEW_POSITIVE[Math.floor(Math.random() * REVIEW_POSITIVE.length)],
    lang: 'ru',
    published_at: now,
    ingested_at: now,
    current_version: 1,
    platform_state: 'visible',
    workflow_status: 'new',
    assignee_user_id: null,
    tag_ids: [],
    sentiment: negative ? 'negative' : 'positive',
    aspects: [],
    reply_count: 0,
    note_count: 0,
    has_published_reply: false,
    response_time_s: null
  };
  db.reviews.unshift(review);
  db.activity.push({
    id: newId('act'),
    review_id: review.id,
    type: 'ingested',
    actor: { kind: 'platform', name: listing.platform_id },
    payload: {},
    at: now
  });
  if (negative) {
    db.notifications.unshift({
      id: newId('ntf'),
      type: 'negative_review',
      title: 'Негативный отзыв',
      body: `${review.author.name} · ${location.name}: «${review.text?.slice(0, 60)}…»`,
      read: false,
      link: `/dashboard/reviews?review=${review.id}`,
      created_at: now
    });
  }
  return {
    type: 'review.ingested',
    review_id: review.id,
    location_id: location.id,
    platform_id: listing.platform_id
  };
}
