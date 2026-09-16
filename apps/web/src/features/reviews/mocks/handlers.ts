import type { Schema } from '@lp/contracts';
import {
  conflict,
  cursorPaginate,
  http,
  inScope,
  latency,
  newId,
  notFound,
  nowIso,
  parseListQuery,
  requirePermission,
  requireSession,
  sortBy,
  validation,
  type ListQuery
} from '@mocks/lib/http';
import type { MockDb } from '@mocks/db';

type Review = Schema<'Review'>;

/** Applies inbox filters (SDD-01 §8 S-REV-01) to the review list. */
export function filterReviews(db: MockDb, q: ListQuery): Review[] {
  const f = q.filters;
  return db.reviews.filter((r) => {
    if (!inScope(db, q.scope, r.location_id)) return false;
    if (
      q.q &&
      !`${r.text ?? ''} ${r.author.name} ${r.location_name ?? ''}`.toLowerCase().includes(q.q)
    )
      return false;
    if (f.platform_id?.length && !f.platform_id.includes(r.platform_id)) return false;
    if (f.rating?.length && !f.rating.includes(r.rating === null ? 'none' : String(r.rating)))
      return false;
    if (f.from?.[0] && r.published_at.slice(0, 10) < f.from[0]) return false;
    if (f.to?.[0] && r.published_at.slice(0, 10) > f.to[0]) return false;
    if (
      f.assignee_user_id?.length &&
      !(r.assignee_user_id && f.assignee_user_id.includes(r.assignee_user_id))
    )
      return false;
    if (
      f.replied_by_user_id?.length &&
      !db.replies.some(
        (rp) =>
          rp.review_id === r.id &&
          rp.author_user_id &&
          f.replied_by_user_id.includes(rp.author_user_id)
      )
    )
      return false;
    if (f.has_reply?.length && String(r.has_published_reply) !== f.has_reply[0]) return false;
    if (f.workflow_status?.length && !f.workflow_status.includes(r.workflow_status)) return false;
    if (f.tag_id?.length && !r.tag_ids.some((t) => f.tag_id.includes(t))) return false;
    if (f.has_text?.length && String(!!r.text) !== f.has_text[0]) return false;
    if (f.platform_state?.length && !f.platform_state.includes(r.platform_state)) return false;
    if (f.location_id?.length && !f.location_id.includes(r.location_id)) return false;
    if (f.sentiment?.length && !(r.sentiment && f.sentiment.includes(r.sentiment))) return false;
    return true;
  });
}

function activity(
  db: MockDb,
  review: Review,
  type: Schema<'ReviewActivity'>['type'],
  user: Schema<'User'> | null,
  payload: Record<string, unknown> = {}
) {
  db.activity.push({
    id: newId('act'),
    review_id: review.id,
    type,
    actor: user ? { kind: 'user', user_id: user.id, name: user.name } : { kind: 'system' },
    payload,
    at: nowIso()
  });
}

export const handlers = [
  http.get('/reviews', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const items = sortBy(
      filterReviews(db, q),
      q.sort.length ? q.sort : [{ field: 'published_at', desc: true }]
    );
    return response(200).json(cursorPaginate(items, q));
  }),

  http.post('/reviews', async ({ request, response }) => {
    await latency(300);
    const { db, user } = requirePermission(request, 'reviews.reply');
    const body = await request.json();
    const location = db.locations.find((l) => l.id === body.location_id);
    if (!location) return validation([{ field: 'location_id', message: 'Компания не найдена' }]);
    const listing = db.listings.find(
      (l) => l.location_id === location.id && l.platform_id === body.platform_id
    );
    const review: Review = {
      id: newId('rev'),
      listing_id: listing?.id ?? newId('lst'),
      location_id: location.id,
      location_name: location.name,
      platform_id: body.platform_id,
      external_id: null,
      url: null,
      author: { name: body.author_name ?? 'Гость', external_id: null, avatar_url: null },
      rating: body.rating ?? null,
      text: body.text ?? null,
      lang: 'ru',
      published_at: body.published_at,
      ingested_at: nowIso(),
      current_version: 1,
      platform_state: 'visible',
      workflow_status: 'new',
      assignee_user_id: null,
      tag_ids: [],
      sentiment:
        body.rating == null
          ? 'neutral'
          : body.rating >= 4
            ? 'positive'
            : body.rating === 3
              ? 'neutral'
              : 'negative',
      aspects: [],
      reply_count: 0,
      note_count: 0,
      has_published_reply: false,
      response_time_s: null
    };
    db.reviews.unshift(review);
    activity(db, review, 'ingested', user, { manual: true });
    return response(201).json(review);
  }),

  http.get('/reviews/summary', async ({ request, response }) => {
    await latency(120);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const items = filterReviews(db, q);
    const rated = items.filter((r) => r.rating !== null);
    return response(200).json({
      total: items.length,
      positive: items.filter((r) => r.rating !== null && r.rating >= 4).length,
      negative: items.filter((r) => r.rating !== null && r.rating <= 2).length,
      without_rating: items.filter((r) => r.rating === null).length,
      average_rating: rated.length
        ? Math.round((rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length) * 100) / 100
        : null,
      unanswered: items.filter(
        (r) => !r.has_published_reply && r.workflow_status !== 'no_reply_needed'
      ).length
    });
  }),

  http.post('/reviews/export', async ({ request, response }) => {
    await latency(300);
    const { db } = requireSession(request);
    const exp: Schema<'Export'> = {
      id: newId('exp'),
      kind: 'reviews',
      state: 'running',
      download_url: null,
      expires_at: null,
      error: null,
      created_at: nowIso()
    };
    db.exports.unshift(exp);
    setTimeout(() => {
      exp.state = 'done';
      exp.download_url = `/__mock/exports/${exp.id}.xlsx`;
    }, 2000).unref();
    return response(202).json(exp);
  }),

  http.get('/reviews/{id}', async ({ request, params, response }) => {
    await latency(80);
    const { db } = requireSession(request);
    const r = db.reviews.find((x) => x.id === params.id);
    return r ? response(200).json(r) : notFound('Review');
  }),

  http.patch('/reviews/{id}', async ({ request, params, response }) => {
    await latency(200);
    const { db, user } = requirePermission(request, 'reviews.reply');
    const r = db.reviews.find((x) => x.id === params.id);
    if (!r) return notFound('Review');
    const body = await request.json();
    if (body.workflow_status && body.workflow_status !== r.workflow_status) {
      activity(db, r, 'status_changed', user, {
        from: r.workflow_status,
        to: body.workflow_status
      });
      r.workflow_status = body.workflow_status;
    }
    if (body.assignee_user_id !== undefined && body.assignee_user_id !== r.assignee_user_id) {
      r.assignee_user_id = body.assignee_user_id;
      activity(db, r, 'assigned', user, { assignee: body.assignee_user_id });
    }
    if (body.tag_ids) {
      r.tag_ids = body.tag_ids;
      activity(db, r, 'tagged', user, { tag_ids: body.tag_ids });
    }
    return response(200).json(r);
  }),

  http.get('/reviews/{id}/versions', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const r = db.reviews.find((x) => x.id === params.id);
    if (!r) return notFound('Review');
    return response(200).json({
      items: db.reviewVersions.get(r.id) ?? [
        { version: 1, rating: r.rating, text: r.text, observed_at: r.ingested_at }
      ]
    });
  }),

  http.get('/reviews/{id}/replies', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (!db.reviews.some((x) => x.id === params.id)) return notFound('Review');
    return response(200).json({ items: db.replies.filter((x) => x.review_id === params.id) });
  }),

  http.post('/reviews/{id}/replies', async ({ request, params, response }) => {
    await latency(400);
    const { db, user } = requirePermission(request, 'reviews.reply');
    const r = db.reviews.find((x) => x.id === params.id);
    if (!r) return notFound('Review');
    const body = await request.json();
    if (!body.text?.trim()) return validation([{ field: 'text', message: 'Введите текст ответа' }]);
    const platform = db.platforms.find((p) => p.id === r.platform_id);
    if (body.publish !== false && platform && !platform.capabilities.reviews?.reply)
      return conflict('Площадка не поддерживает ответы на отзывы');
    const publish = body.publish !== false;
    const reply: Schema<'ReviewReply'> = {
      id: newId('rpl'),
      review_id: r.id,
      author_user_id: user.id,
      author_name: user.name,
      origin: body.origin ?? (body.template_id ? 'template' : 'manual'),
      text: body.text,
      state: publish ? 'requested' : 'draft',
      published_at: null,
      external_id: null,
      error: null,
      response_time_s: null,
      created_at: nowIso()
    };
    db.replies.push(reply);
    r.reply_count++;
    if (publish) {
      activity(db, r, 'reply_requested', user);
      setTimeout(() => {
        reply.state = 'published';
        reply.published_at = nowIso();
        reply.external_id = `rpl-${Date.now()}`;
        reply.response_time_s = Math.max(
          60,
          Math.round((Date.now() - new Date(r.published_at).getTime()) / 1000)
        );
        r.has_published_reply = true;
        r.response_time_s = reply.response_time_s;
        if (db.tenant.settings?.auto_resolve_on_reply !== false) r.workflow_status = 'resolved';
        activity(db, r, 'reply_published', user, { origin: reply.origin });
      }, 2500).unref();
    }
    return response(201).json(reply);
  }),

  http.patch('/reviews/{id}/replies/{replyId}', async ({ request, params, response }) => {
    await latency(300);
    const { db, user } = requirePermission(request, 'reviews.reply');
    const reply = db.replies.find((x) => x.id === params.replyId && x.review_id === params.id);
    if (!reply) return notFound('Reply');
    const body = await request.json();
    reply.text = body.text;
    if (body.publish !== false && reply.state === 'draft') {
      reply.state = 'requested';
      setTimeout(() => {
        reply.state = 'published';
        reply.published_at = nowIso();
        const r = db.reviews.find((x) => x.id === params.id);
        if (r) {
          r.has_published_reply = true;
          activity(db, r, 'reply_published', user);
        }
      }, 2000).unref();
    }
    return response(200).json(reply);
  }),

  http.delete('/reviews/{id}/replies/{replyId}', async ({ request, params, response }) => {
    await latency(300);
    const { db, user } = requirePermission(request, 'reviews.reply');
    const r = db.reviews.find((x) => x.id === params.id);
    const idx = db.replies.findIndex((x) => x.id === params.replyId && x.review_id === params.id);
    if (!r || idx < 0) return notFound('Reply');
    const platform = db.platforms.find((p) => p.id === r.platform_id);
    if (
      db.replies[idx].state === 'published' &&
      platform &&
      !platform.capabilities.reviews?.delete_reply
    )
      return conflict(`${platform.name} не позволяет удалять опубликованные ответы`);
    db.replies.splice(idx, 1);
    r.reply_count = Math.max(0, r.reply_count - 1);
    r.has_published_reply = db.replies.some((x) => x.review_id === r.id && x.state === 'published');
    activity(db, r, 'reply_deleted', user);
    return response(204).empty();
  }),

  http.get('/reviews/{id}/notes', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (!db.reviews.some((x) => x.id === params.id)) return notFound('Review');
    return response(200).json({ items: db.notes.filter((x) => x.review_id === params.id) });
  }),

  http.post('/reviews/{id}/notes', async ({ request, params, response }) => {
    await latency(200);
    const { db, user } = requirePermission(request, 'reviews.reply');
    const r = db.reviews.find((x) => x.id === params.id);
    if (!r) return notFound('Review');
    const body = await request.json();
    if (!body.text?.trim())
      return validation([{ field: 'text', message: 'Введите текст заметки' }]);
    const note: Schema<'ReviewNote'> = {
      id: newId('nte'),
      review_id: r.id,
      user_id: user.id,
      user_name: user.name,
      text: body.text,
      created_at: nowIso()
    };
    db.notes.push(note);
    r.note_count++;
    activity(db, r, 'note_added', user);
    return response(201).json(note);
  }),

  http.delete('/reviews/{id}/notes/{noteId}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'reviews.reply');
    const idx = db.notes.findIndex((x) => x.id === params.noteId && x.review_id === params.id);
    if (idx < 0) return notFound('Note');
    db.notes.splice(idx, 1);
    const r = db.reviews.find((x) => x.id === params.id);
    if (r) r.note_count = Math.max(0, r.note_count - 1);
    return response(204).empty();
  }),

  http.get('/reviews/{id}/complaints', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (!db.reviews.some((x) => x.id === params.id)) return notFound('Review');
    return response(200).json({ items: db.complaints.filter((x) => x.review_id === params.id) });
  }),

  http.post('/reviews/{id}/complaints', async ({ request, params, response }) => {
    await latency(400);
    const { db, user } = requirePermission(request, 'reviews.complain');
    const r = db.reviews.find((x) => x.id === params.id);
    if (!r) return notFound('Review');
    const platform = db.platforms.find((p) => p.id === r.platform_id);
    if (platform && !platform.capabilities.reviews?.complain)
      return conflict(`${platform.name} не принимает жалобы через API`);
    const body = await request.json();
    const c: Schema<'ReviewComplaint'> = {
      id: newId('cmp'),
      review_id: r.id,
      reason_code: body.reason_code,
      text: body.text ?? null,
      state: 'requested',
      submitted_at: null,
      created_at: nowIso()
    };
    db.complaints.push(c);
    r.complaint_state = 'requested';
    activity(db, r, 'complaint_requested', user, { reason: body.reason_code });
    setTimeout(() => {
      c.state = 'submitted';
      c.submitted_at = nowIso();
      r.complaint_state = 'submitted';
      activity(db, r, 'complaint_changed', null, { state: 'submitted' });
    }, 3000).unref();
    return response(201).json(c);
  }),

  http.get('/reviews/{id}/activity', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (!db.reviews.some((x) => x.id === params.id)) return notFound('Review');
    return response(200).json({
      items: db.activity
        .filter((x) => x.review_id === params.id)
        .toSorted((a, b) => (a.at < b.at ? 1 : -1))
    });
  })
];
