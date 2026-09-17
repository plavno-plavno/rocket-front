import type { Schema } from '@lp/contracts';
import {
  http,
  latency,
  newId,
  notFound,
  nowIso,
  parseListQuery,
  requirePermission,
  requireSession,
  validation
} from '@mocks/lib/http';

const key = () => `wk_live_${Math.random().toString(36).slice(2, 10)}`;
const snippet = (w: Schema<'Widget'>) =>
  `<script async src="https://widgets.lp.example/v1/${w.kind === 'reviews' ? 'reviews' : 'locator'}.js" data-key="${w.public_key}"></script>`;

/** Widgets of both kinds (`reviews`, `store_locator`) — shared by the widgets and store-locator features. */
export const handlers = [
  http.get('/widgets', async ({ request, response }) => {
    await latency(120);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.widgets;
    if (q.q) items = items.filter((w) => w.name.toLowerCase().includes(q.q));
    if (q.filters.kind?.length) items = items.filter((w) => q.filters.kind.includes(w.kind));
    return response(200).json({ items });
  }),

  http.post('/widgets', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'integrations.manage');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    const w: Schema<'Widget'> = {
      id: newId('wgt'),
      kind: body.kind,
      name: body.name.trim(),
      config: body.config ?? {},
      public_key: key(),
      allowed_domains: body.allowed_domains ?? [],
      embed_snippet: '',
      created_at: nowIso()
    };
    w.embed_snippet = snippet(w);
    db.widgets.unshift(w);
    return response(201).json(w);
  }),

  http.get('/widgets/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const w = db.widgets.find((x) => x.id === params.id);
    return w ? response(200).json(w) : notFound('Widget');
  }),

  http.put('/widgets/{id}', async ({ request, params, response }) => {
    await latency(250);
    const { db } = requirePermission(request, 'integrations.manage');
    const w = db.widgets.find((x) => x.id === params.id);
    if (!w) return notFound('Widget');
    const body = await request.json();
    Object.assign(w, {
      name: body.name,
      config: body.config ?? w.config,
      allowed_domains: body.allowed_domains ?? w.allowed_domains
    });
    return response(200).json(w);
  }),

  http.delete('/widgets/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'integrations.manage');
    const idx = db.widgets.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Widget');
    db.widgets.splice(idx, 1);
    return response(204).empty();
  }),

  http.post('/widgets/{id}/rotate-key', async ({ request, params, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'integrations.manage');
    const w = db.widgets.find((x) => x.id === params.id);
    if (!w) return notFound('Widget');
    w.public_key = key();
    w.embed_snippet = snippet(w);
    return response(200).json(w);
  })
];
