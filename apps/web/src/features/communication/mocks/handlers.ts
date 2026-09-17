import type { Schema } from '@lp/contracts';
import {
  cursorPaginate,
  http,
  latency,
  newId,
  notFound,
  nowIso,
  parseListQuery,
  requirePermission,
  requireSession,
  scopeLocationIds,
  validation
} from '@mocks/lib/http';

export const handlers = [
  http.get('/conversations', async ({ request, response }) => {
    await latency(120);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const scoped = scopeLocationIds(db, q.scope);
    let items = db.conversations.filter((c) => !scoped || scoped.has(c.location_id));
    if (q.q)
      items = items.filter((c) =>
        `${c.contact_name} ${c.location_name ?? ''} ${c.last_message_preview ?? ''}`
          .toLowerCase()
          .includes(q.q)
      );
    if (q.filters.platform_id?.length)
      items = items.filter((c) => q.filters.platform_id.includes(c.platform_id));
    if (q.filters.status?.length) items = items.filter((c) => q.filters.status.includes(c.status));
    items = items.toSorted((a, b) => (a.last_message_at < b.last_message_at ? 1 : -1));
    return response(200).json(cursorPaginate(items, q));
  }),

  http.get('/conversations/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const c = db.conversations.find((x) => x.id === params.id);
    if (!c) return notFound('Conversation');
    c.unread_count = 0;
    return response(200).json(c);
  }),

  http.patch('/conversations/{id}', async ({ request, params, response }) => {
    await latency(200);
    const { db } = requirePermission(request, 'reviews.reply');
    const c = db.conversations.find((x) => x.id === params.id);
    if (!c) return notFound('Conversation');
    const body = await request.json();
    if (body.status) c.status = body.status;
    if ('assignee_user_id' in body) c.assignee_user_id = body.assignee_user_id;
    return response(200).json(c);
  }),

  http.get('/conversations/{id}/messages', async ({ request, params, response }) => {
    await latency(100);
    const { db } = requireSession(request);
    if (!db.conversations.some((x) => x.id === params.id)) return notFound('Conversation');
    const q = parseListQuery(request);
    const items = db.messages
      .filter((m) => m.conversation_id === params.id)
      .toSorted((a, b) => (a.sent_at < b.sent_at ? -1 : 1));
    return response(200).json(cursorPaginate(items, { ...q, limit: q.limit || 100 }));
  }),

  http.post('/conversations/{id}/messages', async ({ request, params, response }) => {
    await latency(300);
    const { db, user } = requirePermission(request, 'reviews.reply');
    const c = db.conversations.find((x) => x.id === params.id);
    if (!c) return notFound('Conversation');
    const body = await request.json();
    if (!body.text?.trim()) return validation([{ field: 'text', message: 'Введите сообщение' }]);
    const m: Schema<'ConversationMessage'> = {
      id: newId('msg'),
      conversation_id: c.id,
      direction: 'outbound',
      author_user_id: user.id,
      text: body.text.trim(),
      attachments: [],
      state: 'published',
      sent_at: nowIso()
    };
    db.messages.push(m);
    c.last_message_preview = m.text;
    c.last_message_at = m.sent_at;
    return response(201).json(m);
  })
];
