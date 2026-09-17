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

export const handlers = [
  http.get('/products', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.products;
    if (q.q) items = items.filter((p) => p.name.toLowerCase().includes(q.q));
    if (q.filters.category?.length)
      items = items.filter((p) => q.filters.category.includes(p.category));
    return response(200).json(
      paginate(
        sortBy(items, q.sort.length ? q.sort : [{ field: 'updated_at', desc: true }], (p, f) =>
          f === 'price' ? p.price.amount_minor : (p as unknown as Record<string, unknown>)[f]
        ),
        q
      )
    );
  }),

  http.post('/products', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'locations.edit');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    if (!body.price || body.price.amount_minor <= 0)
      return validation([{ field: 'price', message: 'Укажите цену' }]);
    const p: Schema<'Product'> = {
      id: newId('prd'),
      name: body.name.trim(),
      category: body.category,
      description: body.description ?? null,
      price: body.price,
      media_id: body.media_id ?? null,
      image_url: body.media_id
        ? (db.mediaAssets.find((m) => m.id === body.media_id)?.url ?? null)
        : null,
      location_scope: body.location_scope ?? 'all',
      location_ids: body.location_ids ?? [],
      sync_state: { synced: 0, sent: 0, failed: 0 },
      updated_at: nowIso()
    };
    db.products.unshift(p);
    return response(201).json(p);
  }),

  http.get('/products/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const p = db.products.find((x) => x.id === params.id);
    return p ? response(200).json(p) : notFound('Product');
  }),

  http.put('/products/{id}', async ({ request, params, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'locations.edit');
    const p = db.products.find((x) => x.id === params.id);
    if (!p) return notFound('Product');
    const body = await request.json();
    Object.assign(p, {
      name: body.name,
      category: body.category,
      description: body.description ?? null,
      price: body.price,
      media_id: body.media_id ?? null,
      location_scope: body.location_scope ?? 'all',
      location_ids: body.location_ids ?? [],
      updated_at: nowIso()
    });
    return response(200).json(p);
  }),

  http.delete('/products/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'locations.edit');
    const idx = db.products.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Product');
    db.products.splice(idx, 1);
    return response(204).empty();
  }),

  http.post('/products/sync', async ({ request, response }) => {
    await latency(500);
    const { db } = requirePermission(request, 'locations.edit');
    const total = db.products.length;
    // The contract has no `products` batch kind yet (CHANGE_REQUESTS); `schedule` is the closest.
    const batch: Schema<'SyncBatch'> = {
      id: newId('bat'),
      kind: 'schedule',
      state: 'running',
      progress: { total, done: 0, failed: 0 },
      initiator_user_id: null,
      created_at: nowIso(),
      finished_at: null
    };
    db.batches.unshift(batch);
    setTimeout(() => {
      batch.state = 'done';
      batch.progress = { total, done: total, failed: 0 };
      batch.finished_at = nowIso();
      for (const p of db.products)
        p.sync_state = {
          synced: p.sync_state.synced + p.sync_state.sent,
          sent: 0,
          failed: p.sync_state.failed
        };
    }, 2500).unref();
    return response(202).json(batch);
  })
];
