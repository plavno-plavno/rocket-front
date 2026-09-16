import {
  cursorPaginate,
  http,
  latency,
  notFound,
  parseListQuery,
  requireSession
} from '@mocks/lib/http';

export const handlers = [
  http.get('/notifications', async ({ request, response }) => {
    await latency(80);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.notifications.toSorted((a, b) => (a.created_at < b.created_at ? 1 : -1));
    if (q.filters.unread?.[0] === 'true') items = items.filter((n) => !n.read);
    return response(200).json(cursorPaginate(items, q));
  }),
  http.post('/notifications/read-all', ({ request, response }) => {
    const { db } = requireSession(request);
    for (const n of db.notifications) n.read = true;
    return response(204).empty();
  }),
  http.post('/notifications/{id}/read', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const n = db.notifications.find((x) => x.id === params.id);
    if (!n) return notFound('Notification');
    n.read = true;
    return response(200).json(n);
  }),
  http.get('/notifications/settings', ({ request, response }) => {
    const { db } = requireSession(request);
    return response(200).json(db.notificationSettings);
  }),
  http.put('/notifications/settings', async ({ request, response }) => {
    await latency(300);
    const { db } = requireSession(request);
    db.notificationSettings = await request.json();
    return response(200).json(db.notificationSettings);
  })
];
