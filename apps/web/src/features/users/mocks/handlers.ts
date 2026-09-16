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
  http.get('/users', async ({ request, response }) => {
    await latency(100);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.memberships;
    if (q.q)
      items = items.filter((m) => `${m.user.name} ${m.user.email}`.toLowerCase().includes(q.q));
    if (q.filters.role?.length) items = items.filter((m) => q.filters.role.includes(m.role));
    if (q.filters.status?.length) items = items.filter((m) => q.filters.status.includes(m.status));
    items = sortBy(items, q.sort, (m, f) =>
      f === 'name' || f === 'email' ? m.user[f] : (m as unknown as Record<string, unknown>)[f]
    );
    return response(200).json(paginate(items, q));
  }),

  http.get('/users/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const m = db.memberships.find((x) => x.user.id === params.id);
    return m ? response(200).json(m) : notFound('User');
  }),

  http.patch('/users/{id}', async ({ request, params, response }) => {
    await latency(250);
    const { db, membership } = requirePermission(request, 'users.manage');
    const m = db.memberships.find((x) => x.user.id === params.id);
    if (!m) return notFound('User');
    const body = await request.json();
    if (body.role === 'owner' && membership?.role !== 'owner')
      return validation([{ field: 'role', message: 'Назначать владельца может только владелец' }]);
    if (body.role) m.role = body.role;
    if (body.access_rule) m.access_rule = body.access_rule;
    if (body.status) {
      m.status = body.status;
      m.user.status = body.status;
    }
    return response(200).json(m);
  }),

  http.delete('/users/{id}', ({ request, params, response }) => {
    const { db, user } = requirePermission(request, 'users.manage');
    if (params.id === user.id) return validation([{ field: 'id', message: 'Нельзя удалить себя' }]);
    const idx = db.memberships.findIndex((x) => x.user.id === params.id);
    if (idx < 0) return notFound('User');
    db.memberships.splice(idx, 1);
    return response(204).empty();
  }),

  http.get('/invitations', ({ request, response }) => {
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    return response(200).json(
      paginate(
        db.invitations.filter((i) => !i.accepted_at),
        q
      )
    );
  }),

  http.post('/invitations', async ({ request, response }) => {
    await latency(400);
    const { db, membership } = requirePermission(request, 'users.manage');
    const body = await request.json();
    if (body.role === 'owner' && membership?.role !== 'owner')
      return validation([{ field: 'role', message: 'Назначать владельца может только владелец' }]);
    const bad = body.emails.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
    if (bad.length)
      return validation([{ field: 'emails', message: `Некорректный email: ${bad.join(', ')}` }]);
    const items: Schema<'Invitation'>[] = body.emails.map((email) => ({
      id: newId('inv'),
      email,
      role: body.role,
      access_rule: body.access_rule,
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      created_at: nowIso(),
      accepted_at: null
    }));
    db.invitations.push(...items);
    return response(201).json({ items });
  }),

  http.delete('/invitations/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'users.manage');
    const idx = db.invitations.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Invitation');
    db.invitations.splice(idx, 1);
    return response(204).empty();
  }),

  http.post('/invitations/{id}/resend', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'users.manage');
    if (!db.invitations.some((x) => x.id === params.id)) return notFound('Invitation');
    return response(202).empty();
  })
];
