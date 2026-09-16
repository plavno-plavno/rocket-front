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
  sortBy,
  validation
} from '@mocks/lib/http';

const KNOWN = [
  'author_name',
  'location_name',
  'location_address',
  'brand_name',
  'rating',
  'manager_name',
  'platform_name'
];

function unknownVars(body: string) {
  return [...body.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)]
    .map((m) => m[1])
    .filter((v) => !KNOWN.includes(v));
}

export const handlers = [
  http.get('/reply-templates', async ({ request, response }) => {
    await latency(100);
    const { db, user } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.templates.filter((t) => t.visibility === 'team' || t.owner_user_id === user.id);
    if (q.q) items = items.filter((t) => `${t.name} ${t.body}`.toLowerCase().includes(q.q));
    if (q.filters.group_id?.length)
      items = items.filter((t) => t.group_id && q.filters.group_id.includes(t.group_id));
    if (q.filters.visibility?.length)
      items = items.filter((t) => q.filters.visibility.includes(t.visibility));
    items = sortBy(items, q.sort.length ? q.sort : [{ field: 'sort_order', desc: false }]);
    return response(200).json(paginate(items, q));
  }),

  http.post('/reply-templates', async ({ request, response }) => {
    await latency(250);
    const { db, user } = requirePermission(request, 'templates.private');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    const bad = unknownVars(body.body ?? '');
    if (bad.length)
      return validation([{ field: 'body', message: `Неизвестные переменные: ${bad.join(', ')}` }]);
    const tpl: Schema<'ReplyTemplate'> = {
      id: newId('tpl'),
      name: body.name,
      body: body.body,
      group_id: body.group_id ?? null,
      visibility: body.visibility,
      owner_user_id: user.id,
      sort_order: db.templates.length,
      sentiment_hint: body.sentiment_hint,
      usage_count: 0,
      updated_at: nowIso()
    };
    db.templates.push(tpl);
    const g = db.templateGroups.find((x) => x.id === tpl.group_id);
    if (g) g.template_count++;
    return response(201).json(tpl);
  }),

  http.get('/reply-templates/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const t = db.templates.find((x) => x.id === params.id);
    return t ? response(200).json(t) : notFound('Template');
  }),

  http.patch('/reply-templates/{id}', async ({ request, params, response }) => {
    await latency(250);
    const { db } = requirePermission(request, 'templates.private');
    const t = db.templates.find((x) => x.id === params.id);
    if (!t) return notFound('Template');
    const body = await request.json();
    if (body.body !== undefined) {
      const bad = unknownVars(body.body);
      if (bad.length)
        return validation([
          { field: 'body', message: `Неизвестные переменные: ${bad.join(', ')}` }
        ]);
    }
    Object.assign(t, body, { updated_at: nowIso() });
    return response(200).json(t);
  }),

  http.delete('/reply-templates/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'templates.private');
    const idx = db.templates.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Template');
    db.templates.splice(idx, 1);
    return response(204).empty();
  }),

  http.post('/reply-templates/bulk', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'templates.private');
    const body = await request.json();
    const targets = db.templates.filter((t) => body.ids.includes(t.id));
    if (body.action === 'delete')
      db.templates = db.templates.filter((t) => !body.ids.includes(t.id));
    else
      for (const t of targets)
        Object.assign(
          t,
          body.action === 'set_group'
            ? { group_id: body.group_id ?? null }
            : { visibility: body.visibility },
          { updated_at: nowIso() }
        );
    return response(200).json({ items: body.action === 'delete' ? [] : targets });
  }),

  http.post('/reply-templates/reorder', async ({ request, response }) => {
    const { db } = requirePermission(request, 'templates.private');
    const body = await request.json();
    body.ids.forEach((id, i) => {
      const t = db.templates.find((x) => x.id === id);
      if (t) t.sort_order = i;
    });
    return response(204).empty();
  }),

  http.post('/reply-templates/render', async ({ request, response }) => {
    const { db, user } = requireSession(request);
    const body = await request.json();
    const review = body.review_id ? db.reviews.find((r) => r.id === body.review_id) : db.reviews[0];
    const location = db.locations.find((l) => l.id === review?.location_id);
    const ctx: Record<string, string> = {
      author_name: review?.author.name ?? 'Анна',
      location_name: location?.name ?? 'Спортэксперт',
      location_address: location?.address.free_form ?? '',
      brand_name: 'Спортэксперт',
      rating: String(review?.rating ?? 5),
      manager_name: user.name,
      platform_name: review?.platform_id ?? 'Google'
    };
    const variables = [...body.body.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((m) => m[1]);
    return response(200).json({
      text: body.body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (m: string, n: string) => ctx[n] ?? m),
      variables,
      unknown_variables: unknownVars(body.body)
    });
  }),

  http.get('/template-groups', ({ request, response }) => {
    const { db } = requireSession(request);
    return response(200).json({
      items: db.templateGroups.toSorted((a, b) => a.sort_order - b.sort_order)
    });
  }),

  http.post('/template-groups', async ({ request, response }) => {
    const { db } = requirePermission(request, 'templates.team');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    const g: Schema<'TemplateGroup'> = {
      id: newId('tgr'),
      name: body.name,
      sort_order: db.templateGroups.length,
      template_count: 0
    };
    db.templateGroups.push(g);
    return response(201).json(g);
  }),

  http.get('/template-groups/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const g = db.templateGroups.find((x) => x.id === params.id);
    return g ? response(200).json(g) : notFound('Group');
  }),

  http.put('/template-groups/{id}', async ({ request, params, response }) => {
    const { db } = requirePermission(request, 'templates.team');
    const g = db.templateGroups.find((x) => x.id === params.id);
    if (!g) return notFound('Group');
    const body = await request.json();
    g.name = body.name;
    return response(200).json(g);
  }),

  http.delete('/template-groups/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'templates.team');
    const idx = db.templateGroups.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Group');
    db.templateGroups.splice(idx, 1);
    for (const t of db.templates) if (t.group_id === params.id) t.group_id = null;
    return response(204).empty();
  }),

  http.post('/template-groups/reorder', async ({ request, response }) => {
    const { db } = requirePermission(request, 'templates.team');
    const body = await request.json();
    body.ids.forEach((id, i) => {
      const g = db.templateGroups.find((x) => x.id === id);
      if (g) g.sort_order = i;
    });
    return response(204).empty();
  })
];
