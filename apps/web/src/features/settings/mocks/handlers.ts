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
  validation
} from '@mocks/lib/http';

const rand = () => Math.random().toString(36).slice(2, 6);

/** MSW handlers of the settings feature (integrations tag). `/tenants/{id}` lives in session. */
export const handlers = [
  http.get('/integrations/api-keys', ({ request, response }) => {
    const { db } = requireSession(request);
    return response(200).json({ items: db.apiKeys });
  }),

  http.post('/integrations/api-keys', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'integrations.manage');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    const prefix = `lp_live_${rand()}`;
    const key: Schema<'ApiKey'> = {
      id: newId('key'),
      name: body.name.trim(),
      prefix,
      scopes: body.scopes ?? [],
      last_used_at: null,
      created_at: nowIso()
    };
    db.apiKeys.push(key);
    const created: Schema<'ApiKeyCreated'> = {
      ...key,
      secret: `${prefix}${rand()}${rand()}${rand()}${rand()}`
    };
    return response(201).json(created);
  }),

  http.delete('/integrations/api-keys/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'integrations.manage');
    const idx = db.apiKeys.findIndex((k) => k.id === params.id);
    if (idx < 0) return notFound('ApiKey');
    db.apiKeys.splice(idx, 1);
    return response(204).empty();
  }),

  http.get('/integrations/webhooks', ({ request, response }) => {
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    return response(200).json(paginate(db.webhooks, q));
  }),

  http.post('/integrations/webhooks', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'integrations.manage');
    const body = await request.json();
    if (!String(body.url ?? '').startsWith('https://'))
      return validation([{ field: 'url', message: 'Адрес должен начинаться с https://' }]);
    const webhook: Schema<'Webhook'> = {
      id: newId('whk'),
      url: body.url,
      events: body.events ?? [],
      enabled: body.enabled ?? true,
      secret_prefix: `whs_${Math.random().toString(36).slice(2, 4)}`,
      last_delivery_at: null,
      last_delivery_status: null,
      created_at: nowIso()
    };
    db.webhooks.push(webhook);
    db.webhookDeliveries.set(webhook.id, []);
    return response(201).json(webhook);
  }),

  http.get('/integrations/webhooks/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const w = db.webhooks.find((x) => x.id === params.id);
    return w ? response(200).json(w) : notFound('Webhook');
  }),

  http.put('/integrations/webhooks/{id}', async ({ request, params, response }) => {
    await latency(200);
    const { db } = requirePermission(request, 'integrations.manage');
    const w = db.webhooks.find((x) => x.id === params.id);
    if (!w) return notFound('Webhook');
    const body = await request.json();
    Object.assign(w, { url: body.url, events: body.events, enabled: body.enabled ?? true });
    return response(200).json(w);
  }),

  http.delete('/integrations/webhooks/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'integrations.manage');
    const idx = db.webhooks.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Webhook');
    db.webhooks.splice(idx, 1);
    db.webhookDeliveries.delete(params.id);
    return response(204).empty();
  }),

  http.get('/integrations/webhooks/{id}/deliveries', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (!db.webhooks.some((x) => x.id === params.id)) return notFound('Webhook');
    const q = parseListQuery(request);
    return response(200).json(paginate(db.webhookDeliveries.get(params.id) ?? [], q));
  }),

  http.post('/integrations/webhooks/{id}/test', async ({ request, params, response }) => {
    await latency(600);
    const { db } = requirePermission(request, 'integrations.manage');
    const w = db.webhooks.find((x) => x.id === params.id);
    if (!w) return notFound('Webhook');
    const ok = !w.url.includes('fail');
    const delivery: Schema<'WebhookDelivery'> = {
      id: newId('dlv'),
      event: 'test',
      status: ok ? 200 : 502,
      attempted_at: nowIso(),
      error: ok ? null : 'Bad gateway'
    };
    db.webhookDeliveries.set(params.id, [delivery, ...(db.webhookDeliveries.get(params.id) ?? [])]);
    w.last_delivery_at = delivery.attempted_at;
    w.last_delivery_status = delivery.status;
    return response(200).json(delivery);
  })
];
