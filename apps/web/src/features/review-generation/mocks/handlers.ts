import type { Schema } from '@lp/contracts';
import { Random } from '@mocks/lib/random';
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
  http.get('/review-campaigns', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.campaigns;
    if (q.q) items = items.filter((c) => c.name.toLowerCase().includes(q.q));
    if (q.filters.channel?.length)
      items = items.filter((c) => q.filters.channel.includes(c.channel));
    if (q.filters.status?.length) items = items.filter((c) => q.filters.status.includes(c.status));
    return response(200).json(
      paginate(sortBy(items, q.sort.length ? q.sort : [{ field: 'created_at', desc: true }]), q)
    );
  }),

  http.post('/review-campaigns', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'reviews.reply');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    if (!body.target_platform_ids?.length)
      return validation([{ field: 'target_platform_ids', message: 'Выберите площадки' }]);
    const c: Schema<'Campaign'> = {
      id: newId('cmg'),
      name: body.name.trim(),
      channel: body.channel,
      scope: body.scope ?? 'all',
      location_ids: body.location_ids ?? [],
      message_template: body.message_template,
      target_platform_ids: body.target_platform_ids,
      routing: body.routing,
      private_form_enabled: body.private_form_enabled ?? false,
      status: body.status ?? 'draft',
      short_link: `https://lp.link/${Math.random().toString(36).slice(2, 6)}`,
      stats: { sent: 0, opened: 0, clicked: 0, reviews_attributed: 0 },
      created_at: nowIso()
    };
    db.campaigns.unshift(c);
    return response(201).json(c);
  }),

  http.get('/review-campaigns/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const c = db.campaigns.find((x) => x.id === params.id);
    return c ? response(200).json(c) : notFound('Campaign');
  }),

  http.put('/review-campaigns/{id}', async ({ request, params, response }) => {
    await latency(250);
    const { db } = requirePermission(request, 'reviews.reply');
    const c = db.campaigns.find((x) => x.id === params.id);
    if (!c) return notFound('Campaign');
    const body = await request.json();
    Object.assign(c, {
      name: body.name,
      channel: body.channel,
      scope: body.scope ?? 'all',
      location_ids: body.location_ids ?? [],
      message_template: body.message_template,
      target_platform_ids: body.target_platform_ids,
      routing: body.routing,
      private_form_enabled: body.private_form_enabled ?? false,
      status: body.status ?? c.status
    });
    return response(200).json(c);
  }),

  http.delete('/review-campaigns/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'reviews.reply');
    const idx = db.campaigns.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Campaign');
    db.campaigns.splice(idx, 1);
    return response(204).empty();
  }),

  http.get('/review-campaigns/{id}/funnel', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const c = db.campaigns.find((x) => x.id === params.id);
    if (!c) return notFound('Campaign');
    const sp = new URL(request.url).searchParams;
    const to = sp.get('to') ?? nowIso().slice(0, 10);
    const from =
      sp.get('from') ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
    const rnd = new Random(c.id.length * 7919);
    const items: Schema<'CampaignFunnelPoint'>[] = [];
    for (let d = new Date(from); d.toISOString().slice(0, 10) <= to; d.setDate(d.getDate() + 1)) {
      const sent = c.channel === 'qr' ? 0 : rnd.int(60, 220);
      const opened =
        c.channel === 'qr' ? rnd.int(40, 120) : Math.round(sent * rnd.float(0.35, 0.6));
      const clicked = Math.round(opened * rnd.float(0.25, 0.45));
      items.push({
        date: d.toISOString().slice(0, 10),
        sent,
        opened,
        clicked,
        reviews_attributed: Math.round(clicked * rnd.float(0.15, 0.35))
      });
    }
    return response(200).json({ items });
  }),

  http.post('/review-campaigns/{id}/send', async ({ request, params, response }) => {
    await latency(500);
    const { db } = requirePermission(request, 'reviews.reply');
    const c = db.campaigns.find((x) => x.id === params.id);
    if (!c) return notFound('Campaign');
    const body = await request.json();
    const recipients: { location_id: string; contact: string }[] = body.recipients ?? [];
    if (recipients.length === 0)
      return validation([{ field: 'recipients', message: 'Добавьте хотя бы одного получателя' }]);
    c.stats.sent += recipients.length;
    const batch: Schema<'SyncBatch'> = {
      id: newId('bat'),
      kind: 'schedule',
      state: 'done',
      progress: { total: recipients.length, done: recipients.length, failed: 0 },
      initiator_user_id: null,
      created_at: nowIso(),
      finished_at: nowIso()
    };
    db.batches.unshift(batch);
    return response(202).json(batch);
  }),

  http.post('/review-campaigns/qr-export', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'reviews.reply');
    const exp: Schema<'Export'> = {
      id: newId('exp'),
      kind: 'qr_pdf',
      state: 'running',
      download_url: null,
      expires_at: null,
      error: null,
      created_at: nowIso()
    };
    db.exports.unshift(exp);
    setTimeout(() => {
      exp.state = 'done';
      exp.download_url = `/__mock/exports/${exp.id}.pdf`;
    }, 2000).unref();
    return response(202).json(exp);
  })
];
