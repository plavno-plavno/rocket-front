import type { Schema } from '@lp/contracts';
import {
  http,
  latency,
  newId,
  notFound,
  requirePermission,
  requireSession,
  validation
} from '@mocks/lib/http';

export const handlers = [
  http.get('/tags', async ({ request, response }) => {
    await latency(60);
    const { db } = requireSession(request);
    return response(200).json({ items: db.tags });
  }),
  http.post('/tags', async ({ request, response }) => {
    const { db } = requirePermission(request, 'reviews.reply');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    if (db.tags.some((t) => t.name.toLowerCase() === body.name.toLowerCase()))
      return validation([{ field: 'name', message: 'Тег с таким названием уже есть' }]);
    const tag: Schema<'Tag'> = {
      id: newId('tag'),
      name: body.name,
      color: body.color,
      review_count: 0
    };
    db.tags.push(tag);
    return response(201).json(tag);
  }),
  http.get('/tags/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const t = db.tags.find((x) => x.id === params.id);
    return t ? response(200).json(t) : notFound('Tag');
  }),
  http.put('/tags/{id}', async ({ request, params, response }) => {
    const { db } = requirePermission(request, 'reviews.reply');
    const t = db.tags.find((x) => x.id === params.id);
    if (!t) return notFound('Tag');
    const body = await request.json();
    Object.assign(t, { name: body.name, color: body.color });
    return response(200).json(t);
  }),
  http.delete('/tags/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'reviews.reply');
    const idx = db.tags.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Tag');
    db.tags.splice(idx, 1);
    for (const r of db.reviews) r.tag_ids = r.tag_ids.filter((id) => id !== params.id);
    return response(204).empty();
  })
];
