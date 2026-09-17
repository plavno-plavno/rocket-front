import type { Schema } from '@lp/contracts';
import {
  http,
  latency,
  newId,
  notFound,
  nowIso,
  paginate,
  parseListQuery,
  requirePermission,
  requireSession,
  scopeLocationIds,
  sortBy,
  validation
} from '@mocks/lib/http';
import type { MockDb } from '@mocks/db';

/** Fan a publication out to listings of its locations × platforms; the mock finishes it in ~2 s. */
function fanOut(db: MockDb, p: Schema<'Publication'>) {
  const scoped = p.location_ids?.length ? new Set(p.location_ids) : scopeLocationIds(db, p.scope);
  const locations = db.locations.filter((l) => !l.deleted_at && (!scoped || scoped.has(l.id)));
  p.location_ids = locations.map((l) => l.id);
  p.results = locations.flatMap((l) =>
    p.platform_ids.map((platform) => ({
      listing_id:
        db.listings.find((x) => x.location_id === l.id && x.platform_id === platform)?.id ??
        'lst_none',
      platform_id: platform,
      state: 'queued' as const,
      external_id: null,
      url: null,
      error: null
    }))
  );
  p.state = 'publishing';
  setTimeout(() => {
    let failed = 0;
    p.results = p.results.map((r, i) => {
      const fail = r.listing_id === 'lst_none' || i % 17 === 0;
      if (fail) failed++;
      return fail
        ? {
            ...r,
            state: 'failed' as const,
            error:
              r.listing_id === 'lst_none'
                ? 'Карточка не подключена'
                : 'Площадка отклонила публикацию'
          }
        : {
            ...r,
            state: 'published' as const,
            external_id: newId('ext'),
            url: 'https://example.ru/post'
          };
    });
    p.state =
      failed === 0 ? 'published' : failed === p.results.length ? 'failed' : 'partially_failed';
  }, 2000).unref();
}

export const handlers = [
  http.get('/publications', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.publications;
    if (q.q) items = items.filter((p) => `${p.title ?? ''} ${p.text}`.toLowerCase().includes(q.q));
    if (q.filters.state?.length) items = items.filter((p) => q.filters.state.includes(p.state));
    if (q.filters.type?.length) items = items.filter((p) => q.filters.type.includes(p.type));
    if (q.filters.platform_id?.length)
      items = items.filter((p) => p.platform_ids.some((id) => q.filters.platform_id.includes(id)));
    return response(200).json(
      paginate(sortBy(items, q.sort.length ? q.sort : [{ field: 'created_at', desc: true }]), q)
    );
  }),

  http.post('/publications', async ({ request, response }) => {
    await latency(400);
    const { db, user } = requirePermission(request, 'publications.edit');
    const body = await request.json();
    if (!body.text?.trim())
      return validation([{ field: 'text', message: 'Введите текст публикации' }]);
    if (!body.platform_ids?.length)
      return validation([{ field: 'platform_ids', message: 'Выберите хотя бы одну площадку' }]);
    const scheduled = !!body.schedule_at && body.schedule_at > nowIso();
    const p: Schema<'Publication'> = {
      id: newId('pub'),
      type: body.type,
      title: body.title ?? null,
      text: body.text,
      media_ids: body.media_ids ?? [],
      cta: body.cta ?? null,
      platform_ids: body.platform_ids,
      scope: body.scope ?? 'all',
      location_ids: body.location_ids ?? [],
      schedule_at: body.schedule_at ?? null,
      starts_at: body.starts_at ?? null,
      ends_at: body.ends_at ?? null,
      state: scheduled ? 'scheduled' : 'publishing',
      results: [],
      created_by: user.id,
      created_at: nowIso()
    };
    db.publications.unshift(p);
    if (!scheduled) fanOut(db, p);
    return response(201).json(p);
  }),

  http.get('/publications/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const p = db.publications.find((x) => x.id === params.id);
    return p ? response(200).json(p) : notFound('Publication');
  }),

  http.put('/publications/{id}', async ({ request, params, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'publications.edit');
    const p = db.publications.find((x) => x.id === params.id);
    if (!p) return notFound('Publication');
    const body = await request.json();
    Object.assign(p, {
      type: body.type,
      title: body.title ?? null,
      text: body.text,
      media_ids: body.media_ids ?? [],
      cta: body.cta ?? null,
      platform_ids: body.platform_ids,
      scope: body.scope ?? 'all',
      location_ids: body.location_ids ?? [],
      schedule_at: body.schedule_at ?? null
    });
    if (p.state === 'draft' || p.state === 'scheduled') {
      const scheduled = !!body.schedule_at && body.schedule_at > nowIso();
      if (scheduled) p.state = 'scheduled';
      else fanOut(db, p);
    }
    return response(200).json(p);
  }),

  http.delete('/publications/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'publications.edit');
    const idx = db.publications.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Publication');
    db.publications.splice(idx, 1);
    return response(204).empty();
  }),

  http.post('/publications/{id}/retry', async ({ request, params, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'publications.edit');
    const p = db.publications.find((x) => x.id === params.id);
    if (!p) return notFound('Publication');
    p.results = p.results.map((r) =>
      r.state === 'failed' || r.state === 'rejected' ? { ...r, state: 'queued', error: null } : r
    );
    p.state = 'publishing';
    setTimeout(() => {
      p.results = p.results.map((r) =>
        r.state === 'queued' ? { ...r, state: 'published', external_id: newId('ext') } : r
      );
      p.state = 'published';
    }, 1500).unref();
    return response(202).json(p);
  })
];
