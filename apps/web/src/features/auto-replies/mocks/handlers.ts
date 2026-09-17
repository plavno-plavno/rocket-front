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

/** MSW handlers of the auto-replies feature (S-REV-04). Registered automatically by `pnpm gen`. */
export const handlers = [
  http.get('/auto-reply-rules', async ({ request, response }) => {
    await latency();
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.autoReplyRules.toSorted((a, b) => a.priority - b.priority);
    if (q.q) items = items.filter((r) => r.name.toLowerCase().includes(q.q));
    return response(200).json({ items });
  }),

  http.post('/auto-reply-rules', async ({ request, response }) => {
    await latency(250);
    const { db } = requirePermission(request, 'templates.team');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Введите название' }]);
    const rule: Schema<'AutoReplyRule'> = {
      id: newId('rule'),
      name: body.name,
      enabled: body.enabled ?? true,
      priority: db.autoReplyRules.length + 1,
      conditions: body.conditions ?? {},
      action: body.action ?? {},
      mode: body.mode ?? 'draft',
      delay_minutes: body.delay_minutes ?? 0,
      working_hours_only: body.working_hours_only ?? true,
      stats: { fired_30d: 0 },
      updated_at: nowIso()
    };
    db.autoReplyRules.push(rule);
    return response(201).json(rule);
  }),

  http.get('/auto-reply-rules/{id}', async ({ request, params, response }) => {
    await latency();
    const { db } = requireSession(request);
    const rule = db.autoReplyRules.find((r) => r.id === params.id);
    if (!rule) return notFound('Rule');
    return response(200).json(rule);
  }),

  http.put('/auto-reply-rules/{id}', async ({ request, params, response }) => {
    await latency(250);
    const { db } = requirePermission(request, 'templates.team');
    const rule = db.autoReplyRules.find((r) => r.id === params.id);
    if (!rule) return notFound('Rule');
    const body = await request.json();
    Object.assign(rule, {
      name: body.name ?? rule.name,
      enabled: body.enabled ?? rule.enabled,
      conditions: body.conditions ?? rule.conditions,
      action: body.action ?? rule.action,
      mode: body.mode ?? rule.mode,
      delay_minutes: body.delay_minutes ?? rule.delay_minutes,
      working_hours_only: body.working_hours_only ?? rule.working_hours_only,
      updated_at: nowIso()
    });
    return response(200).json(rule);
  }),

  http.delete('/auto-reply-rules/{id}', async ({ request, params, response }) => {
    await latency();
    const { db } = requirePermission(request, 'templates.team');
    const i = db.autoReplyRules.findIndex((r) => r.id === params.id);
    if (i < 0) return notFound('Rule');
    db.autoReplyRules.splice(i, 1);
    return response(204).empty();
  }),

  http.post('/auto-reply-rules/reorder', async ({ request, response }) => {
    await latency();
    const { db } = requirePermission(request, 'templates.team');
    const body = await request.json();
    (body.ids as string[]).forEach((id, i) => {
      const rule = db.autoReplyRules.find((r) => r.id === id);
      if (rule) rule.priority = i + 1;
    });
    return response(204).empty();
  })
];
