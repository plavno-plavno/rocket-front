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
  scopeLocationIds,
  validation
} from '@mocks/lib/http';

export const handlers = [
  http.get('/platforms', async ({ request, response }) => {
    await latency(60);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const items = q.filters.kind?.length
      ? db.platforms.filter((p) => q.filters.kind.includes(p.kind))
      : db.platforms;
    return response(200).json({ items });
  }),

  http.get('/platforms/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const p = db.platforms.find((x) => x.id === params.id);
    return p ? response(200).json(p) : notFound('Platform');
  }),

  http.get('/platforms/{id}/complaint-reasons', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (!db.platforms.some((x) => x.id === params.id)) return notFound('Platform');
    return response(200).json({
      items: [
        { code: 'spam', title: 'Спам или реклама' },
        { code: 'offensive', title: 'Оскорбления' },
        { code: 'not_a_customer', title: 'Автор не был клиентом' },
        { code: 'competitor', title: 'Отзыв от конкурента' },
        { code: 'wrong_place', title: 'Отзыв о другом месте' }
      ]
    });
  }),

  http.get('/platform-accounts', ({ request, response }) => {
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.platformAccounts;
    if (q.filters.platform_id?.length)
      items = items.filter((a) => q.filters.platform_id.includes(a.platform_id));
    if (q.filters.status?.length) items = items.filter((a) => q.filters.status.includes(a.status));
    return response(200).json({ items });
  }),

  http.post('/platform-accounts', async ({ request, response }) => {
    await latency(400);
    const { db } = requirePermission(request, 'accounts.manage');
    const body = await request.json();
    const platform = db.platforms.find((p) => p.id === body.platform_id);
    if (!platform) return validation([{ field: 'platform_id', message: 'Неизвестная площадка' }]);
    const account: Schema<'PlatformAccount'> = {
      id: newId('pac'),
      platform_id: platform.id,
      auth_kind: body.auth_kind,
      status: body.auth_kind === 'oauth' ? 'reauth_required' : 'ok',
      display_name: body.display_name ?? `${platform.name} · ${db.tenant.name}`,
      external_account_id: null,
      listing_count: 0,
      last_checked_at: nowIso(),
      created_at: nowIso()
    };
    db.platformAccounts.push(account);
    return response(201).json(account);
  }),

  http.get('/platform-accounts/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const a = db.platformAccounts.find((x) => x.id === params.id);
    return a ? response(200).json(a) : notFound('Account');
  }),

  http.delete('/platform-accounts/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'accounts.manage');
    const idx = db.platformAccounts.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Account');
    const [removed] = db.platformAccounts.splice(idx, 1);
    for (const l of db.listings)
      if (l.platform_account_id === removed.id)
        Object.assign(l, { platform_account_id: null, sync_status: 'not_connected' });
    return response(204).empty();
  }),

  http.post('/platform-accounts/{id}/oauth/start', async ({ request, params, response }) => {
    await latency(200);
    const { db } = requirePermission(request, 'accounts.manage');
    const a = db.platformAccounts.find((x) => x.id === params.id);
    if (!a) return notFound('Account');
    // The mock "OAuth provider" is a page of the mock server that flips the account to ok.
    return response(200).json({
      redirect_url: `http://localhost:${process.env.MOCK_PORT ?? 4010}/__mock/oauth/${a.id}`
    });
  }),

  http.post('/platform-accounts/{id}/check', async ({ request, params, response }) => {
    await latency(700);
    const { db } = requirePermission(request, 'accounts.manage');
    const a = db.platformAccounts.find((x) => x.id === params.id);
    if (!a) return notFound('Account');
    a.last_checked_at = nowIso();
    return response(200).json(a);
  }),

  http.get('/sources/overview', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const scoped = scopeLocationIds(db, q.scope);
    const locationTotal = scoped ? scoped.size : db.locations.filter((l) => !l.deleted_at).length;
    const items: Schema<'SourceOverview'>[] = db.platforms.map((platform) => {
      const counts: Schema<'ListingStatusCounts'> = {
        synced: 0,
        sent: 0,
        action_required: 0,
        not_connected: 0,
        unsupported: 0,
        error: 0,
        total: 0
      };
      const covered = new Set<string>();
      for (const l of db.listings) {
        if (l.platform_id !== platform.id) continue;
        if (scoped && (!l.location_id || !scoped.has(l.location_id))) continue;
        counts[l.sync_status]++;
        counts.total++;
        if (l.sync_status !== 'not_connected' && l.location_id) covered.add(l.location_id);
      }
      return {
        platform,
        listing_counts: counts,
        accounts: db.platformAccounts.filter((a) => a.platform_id === platform.id),
        coverage_percent: locationTotal ? Math.round((covered.size / locationTotal) * 100) : 0
      };
    });
    return response(200).json({ items });
  }),

  http.get('/settings/sources', ({ request, response }) => {
    const { db } = requireSession(request);
    return response(200).json(db.sourceSettings);
  }),

  http.put('/settings/sources', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'accounts.manage');
    db.sourceSettings = await request.json();
    return response(200).json(db.sourceSettings);
  })
];
