import type { Schema } from '@lp/contracts';
import { TENANT_ID, type MockDb } from '@mocks/db';
import {
  conflict,
  http,
  inScope,
  latency,
  newId,
  notFound,
  nowIso,
  paginate,
  parseListQuery,
  requirePermission,
  requireSession,
  scopeLocationIds,
  sortBy,
  validation,
  type ListQuery
} from '@mocks/lib/http';

type Location = Schema<'Location'>;
type LocationListItem = Schema<'LocationListItem'>;

const MAP_KINDS: Schema<'PlatformKind'>[] = ['map', 'catalog', 'social', 'review_site', 'delivery'];

function toListItem(db: MockDb, loc: Location): LocationListItem {
  return {
    id: loc.id,
    branch_code: loc.branch_code ?? null,
    name: loc.name,
    status: loc.status,
    address: loc.address,
    group_ids: loc.group_ids,
    listing_statuses: db.listings
      .filter((l) => l.location_id === loc.id)
      .map((l) => ({
        listing_id: l.id,
        platform_id: l.platform_id,
        sync_status: l.sync_status,
        action_reason: l.action_reason,
        url: l.url ?? null
      })),
    updated_at: loc.updated_at
  };
}

function filterLocations(db: MockDb, q: ListQuery): Location[] {
  const scoped = scopeLocationIds(db, q.scope);
  const f = q.filters;
  const platformKind = f.platform_kind?.[0];
  const kindPlatforms = platformKind
    ? new Set(
        db.platforms
          .filter((p) =>
            platformKind === 'navigator' ? p.kind === 'navigator' : MAP_KINDS.includes(p.kind)
          )
          .map((p) => p.id)
      )
    : null;
  return db.locations.filter((loc) => {
    if (loc.deleted_at) return false;
    if (scoped && !scoped.has(loc.id)) return false;
    if (
      q.q &&
      !`${loc.name} ${loc.address.city} ${loc.address.free_form ?? ''} ${loc.branch_code ?? ''}`
        .toLowerCase()
        .includes(q.q)
    )
      return false;
    if (f.city?.length && !f.city.includes(loc.address.city)) return false;
    if (f.status?.length && !f.status.includes(loc.status)) return false;
    if (f.group_id?.length && !f.group_id.some((g) => loc.group_ids.includes(g))) return false;
    if (f.sync_status?.length || f.platform_id?.length || kindPlatforms) {
      const listings = db.listings.filter(
        (l) => l.location_id === loc.id && (!kindPlatforms || kindPlatforms.has(l.platform_id))
      );
      if (
        f.platform_id?.length &&
        !listings.some(
          (l) => f.platform_id.includes(l.platform_id) && l.sync_status !== 'not_connected'
        )
      )
        return false;
      if (f.sync_status?.length && !listings.some((l) => f.sync_status.includes(l.sync_status)))
        return false;
    }
    return true;
  });
}

const sortAccessor = (loc: Location, field: string): unknown => {
  switch (field) {
    case 'city':
      return loc.address.city;
    case 'address':
      return loc.address.free_form;
    default:
      return (loc as unknown as Record<string, unknown>)[field];
  }
};

function validateLocation(body: Partial<Schema<'LocationCore'>>) {
  const errors: { field: string; message: string }[] = [];
  if (!body.name?.trim()) errors.push({ field: 'name', message: 'Укажите название' });
  if (!body.address?.city?.trim()) errors.push({ field: 'address.city', message: 'Укажите город' });
  if (!body.address?.country) errors.push({ field: 'address.country', message: 'Укажите страну' });
  for (const p of body.phones ?? [])
    if (!/^\+\d{10,15}$/.test(p.e164))
      errors.push({ field: 'phones', message: `Телефон ${p.e164} должен быть в формате E.164` });
  return errors;
}

function recomputeGroups(db: MockDb) {
  for (const g of db.groups)
    g.location_count = db.locations.filter(
      (l) => !l.deleted_at && l.group_ids.includes(g.id)
    ).length;
}

function assignGroups(db: MockDb, loc: Location) {
  const ids = new Set<string>();
  if (loc.brand_group_id) ids.add(loc.brand_group_id);
  for (const g of db.groups) {
    const filter = g.rule?.filter as Record<string, string> | undefined;
    if (filter?.city && filter.city === loc.address.city) ids.add(g.id);
    if (filter?.region_code && g.name === loc.address.region) ids.add(g.id);
    if (g.rule?.location_ids?.includes(loc.id)) ids.add(g.id);
  }
  loc.group_ids = [...ids];
}

function createListingsFor(db: MockDb, loc: Location) {
  for (const account of db.platformAccounts) {
    db.listings.push({
      id: newId('lst'),
      location_id: loc.id,
      platform_id: account.platform_id,
      platform_account_id: account.id,
      external_id: null,
      url: null,
      ownership: 'unclaimed',
      verification: 'unverified',
      match_state: 'candidate',
      duplicate_of: null,
      match_score: null,
      sync_status: 'sent',
      action_reason: undefined,
      action_hint: null,
      observed_name: null,
      observed_address: null,
      drift_fields: [],
      last_snapshot_at: null,
      last_seen_at: null
    });
    account.listing_count++;
  }
  // Simulate the platforms confirming the new cards a few seconds later.
  setTimeout(() => {
    for (const l of db.listings) {
      if (l.location_id === loc.id && l.sync_status === 'sent') {
        l.sync_status = 'synced';
        l.external_id = `${l.platform_id.replace('plt_', '')}-${Math.floor(Math.random() * 1e9)}`;
        l.url = `https://example.com/place/${Math.floor(Math.random() * 1e7)}`;
        l.match_state = 'confirmed';
        l.ownership = 'owned';
        l.verification = 'verified';
        l.last_snapshot_at = nowIso();
      }
    }
    loc.listing_summary = countStatuses(db, loc.id);
  }, 8000).unref();
}

export function countStatuses(db: MockDb, locationId: string): Schema<'ListingStatusCounts'> {
  const counts: Schema<'ListingStatusCounts'> = {
    synced: 0,
    sent: 0,
    action_required: 0,
    not_connected: 0,
    unsupported: 0,
    error: 0,
    total: 0
  };
  for (const l of db.listings) {
    if (l.location_id !== locationId) continue;
    counts[l.sync_status]++;
    counts.total++;
  }
  return counts;
}

export const handlers = [
  http.get('/locations', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const filtered = sortBy(
      filterLocations(db, q),
      q.sort.length ? q.sort : [{ field: 'name', desc: false }],
      sortAccessor
    );
    const page = paginate(filtered, q);
    return response(200).json({ items: page.items.map((l) => toListItem(db, l)), meta: page.meta });
  }),

  http.post('/locations', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'locations.edit');
    const body = await request.json();
    const errors = validateLocation(body);
    if (errors.length) return validation(errors);
    const now = nowIso();
    const loc: Location = {
      ...body,
      id: newId('loc'),
      tenant_id: TENANT_ID,
      branch_code: body.branch_code ?? null,
      brand_group_id: body.brand_group_id ?? db.groups.find((g) => g.kind === 'brand')?.id ?? null,
      status: body.status ?? 'open',
      phones: body.phones ?? [],
      emails: body.emails ?? [],
      social: body.social ?? [],
      hours: body.hours ?? { regular: [], special: [] },
      categories: body.categories ?? { primary: 'cat_sporting_goods', additional: [] },
      attributes: body.attributes ?? {},
      media: body.media ?? { logo: null, cover: null, photos: [] },
      platform_overrides: body.platform_overrides ?? {},
      field_policies: body.field_policies ?? {},
      timezone: body.timezone ?? db.tenant.timezone,
      version: 1,
      group_ids: [],
      listing_summary: undefined,
      created_at: now,
      updated_at: now,
      deleted_at: null
    };
    assignGroups(db, loc);
    db.locations.push(loc);
    db.locationVersions.set(loc.id, [
      { version: 1, author: { kind: 'user', name: 'Вы' }, changed_fields: ['*'], created_at: now }
    ]);
    createListingsFor(db, loc);
    loc.listing_summary = countStatuses(db, loc.id);
    recomputeGroups(db);
    return response(201).json(loc);
  }),

  http.get('/locations/{id}', async ({ request, params, response }) => {
    await latency(100);
    const { db } = requireSession(request);
    const loc = db.locations.find((l) => l.id === params.id && !l.deleted_at);
    if (!loc) return notFound('Location');
    loc.listing_summary = countStatuses(db, loc.id);
    return response(200).json(loc);
  }),

  http.put('/locations/{id}', async ({ request, params, response }) => {
    await latency(300);
    const { db, user } = requirePermission(request, 'locations.edit');
    const loc = db.locations.find((l) => l.id === params.id && !l.deleted_at);
    if (!loc) return notFound('Location');
    const body = await request.json();
    if (body.version !== loc.version)
      return conflict(`Локация была изменена (версия ${loc.version}). Обновите страницу.`);
    const errors = validateLocation(body);
    if (errors.length) return validation(errors);
    const changed = (Object.keys(body) as (keyof typeof body)[]).filter(
      (k) => k !== 'version' && JSON.stringify(body[k]) !== JSON.stringify(loc[k as keyof Location])
    );
    Object.assign(loc, body, { version: loc.version + 1, updated_at: nowIso() });
    assignGroups(db, loc);
    recomputeGroups(db);
    db.locationVersions.get(loc.id)?.unshift({
      version: loc.version,
      author: { kind: 'user', user_id: user.id, name: user.name },
      changed_fields: changed as string[],
      created_at: loc.updated_at
    });
    for (const l of db.listings)
      if (l.location_id === loc.id && l.sync_status === 'synced' && changed.length)
        l.sync_status = 'sent';
    setTimeout(() => {
      for (const l of db.listings)
        if (l.location_id === loc.id && l.sync_status === 'sent') l.sync_status = 'synced';
    }, 6000).unref();
    loc.listing_summary = countStatuses(db, loc.id);
    return response(200).json(loc);
  }),

  http.delete('/locations/{id}', async ({ request, params, response }) => {
    await latency(200);
    const { db } = requirePermission(request, 'locations.edit');
    const loc = db.locations.find((l) => l.id === params.id && !l.deleted_at);
    if (!loc) return notFound('Location');
    loc.deleted_at = nowIso();
    loc.status = 'permanently_closed';
    recomputeGroups(db);
    return response(204).empty();
  }),

  http.get('/locations/{id}/versions', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (!db.locations.some((l) => l.id === params.id)) return notFound('Location');
    return response(200).json({ items: db.locationVersions.get(params.id) ?? [] });
  }),

  http.get('/locations/{id}/versions/{version}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const loc = db.locations.find((l) => l.id === params.id);
    if (!loc) return notFound('Location');
    return response(200).json({ ...loc, version: Number(params.version) });
  }),

  http.post(
    '/locations/{id}/versions/{version}/rollback',
    async ({ request, params, response }) => {
      await latency(300);
      const { db, user } = requirePermission(request, 'locations.edit');
      const loc = db.locations.find((l) => l.id === params.id);
      if (!loc) return notFound('Location');
      loc.version += 1;
      loc.updated_at = nowIso();
      db.locationVersions.get(loc.id)?.unshift({
        version: loc.version,
        author: { kind: 'user', user_id: user.id, name: user.name },
        changed_fields: [`rollback:${params.version}`],
        created_at: loc.updated_at
      });
      return response(200).json(loc);
    }
  ),

  http.get('/locations/{id}/listings', async ({ request, params, response }) => {
    await latency(100);
    const { db } = requireSession(request);
    if (!db.locations.some((l) => l.id === params.id)) return notFound('Location');
    return response(200).json({ items: db.listings.filter((l) => l.location_id === params.id) });
  }),

  http.post('/locations/{id}/preview-sync', async ({ request, params, response }) => {
    await latency(400);
    const { db } = requireSession(request);
    const loc = db.locations.find((l) => l.id === params.id);
    if (!loc) return notFound('Location');
    const body = await request.json();
    const changes = (
      ['name', 'phones', 'hours', 'description', 'website', 'address'] as const
    ).filter((k) => JSON.stringify(body[k]) !== JSON.stringify(loc[k]));
    const listings = db.listings.filter(
      (l) =>
        l.location_id === loc.id &&
        l.sync_status !== 'not_connected' &&
        l.sync_status !== 'unsupported'
    );
    return response(200).json({
      available: true,
      listings: listings.map((l) => {
        const platform = db.platforms.find((p) => p.id === l.platform_id)!;
        return {
          listing_id: l.id,
          platform_id: l.platform_id,
          changes: changes.map((field) => ({
            field,
            from: loc[field],
            to: body[field],
            note:
              field === 'hours' && platform.capabilities.listing?.moderation === 'manual'
                ? 'Ручная модерация: 1–3 дня'
                : null
          })),
          warnings:
            platform.capabilities.listing?.moderation === 'async' && changes.includes('name')
              ? ['Изменение названия проходит модерацию площадки']
              : []
        };
      })
    });
  }),

  http.post('/locations/bulk', async ({ request, response }) => {
    await latency(400);
    const { db, user } = requirePermission(request, 'locations.edit');
    const q = parseListQuery(request);
    const body = await request.json();
    const targets = body.location_ids?.length
      ? db.locations.filter((l) => body.location_ids!.includes(l.id))
      : filterLocations(db, q);
    const batch: Schema<'SyncBatch'> = {
      id: newId('bat'),
      kind: 'bulk_edit',
      state: 'running',
      progress: { total: 0, done: 0, failed: 0 },
      initiator_user_id: user.id,
      created_at: nowIso(),
      finished_at: null
    };
    const items: Schema<'SyncBatchItem'>[] = [];
    for (const loc of targets) {
      Object.assign(loc, body.patch, { version: loc.version + 1, updated_at: nowIso() });
      for (const l of db.listings) {
        if (
          l.location_id !== loc.id ||
          l.sync_status === 'not_connected' ||
          l.sync_status === 'unsupported'
        )
          continue;
        l.sync_status = 'sent';
        items.push({
          operation_id: newId('op'),
          listing_id: l.id,
          location_id: loc.id,
          platform_id: l.platform_id,
          state: 'sent',
          error: null
        });
      }
    }
    batch.progress.total = items.length;
    db.batches.push(batch);
    db.batchItems.set(batch.id, items);
    // progress simulation
    let i = 0;
    const timer = setInterval(() => {
      const chunk = items.slice(i, i + Math.max(5, Math.ceil(items.length / 10)));
      for (const item of chunk) {
        const fail = Math.random() < 0.03;
        item.state = fail ? 'failed_terminal' : 'confirmed';
        item.error = fail ? 'VALIDATION_REJECTED: phone format' : null;
        const l = db.listings.find((x) => x.id === item.listing_id);
        if (l) l.sync_status = fail ? 'error' : 'synced';
        if (fail) batch.progress.failed++;
        else batch.progress.done++;
      }
      i += chunk.length;
      if (i >= items.length) {
        clearInterval(timer);
        batch.state = batch.progress.failed ? 'partially_failed' : 'done';
        batch.finished_at = nowIso();
      }
    }, 700).unref();
    return response(202).json(batch);
  }),

  http.post('/locations/export', async ({ request, response }) => {
    await latency(300);
    const { db } = requireSession(request);
    const exp: Schema<'Export'> = {
      id: newId('exp'),
      kind: 'locations',
      state: 'running',
      download_url: null,
      expires_at: null,
      error: null,
      created_at: nowIso()
    };
    db.exports.unshift(exp);
    setTimeout(() => {
      exp.state = 'done';
      exp.download_url = `/__mock/exports/${exp.id}.xlsx`;
      exp.expires_at = new Date(Date.now() + 3600_000).toISOString();
    }, 2500).unref();
    return response(202).json(exp);
  }),

  http.post('/locations/import', async ({ request, response }) => {
    await latency(600);
    const { db } = requirePermission(request, 'locations.edit');
    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    const name = file instanceof File ? file.name : 'import.xlsx';
    const columns = ['Код филиала', 'Название', 'Город', 'Адрес', 'Телефон', 'Сайт', 'Часы работы'];
    const rows: (string | null)[][] = db.locations
      .slice(0, 8)
      .map((l) => [
        l.branch_code ?? null,
        l.name,
        l.address.city,
        l.address.free_form ?? null,
        l.phones?.[0]?.e164 ?? null,
        l.website ?? null,
        'пн-пт 10:00-22:00'
      ]);
    rows.push([
      '999',
      `Новый магазин из ${name}`,
      'Тверь',
      'Тверь, Советская улица, 5',
      '+74822000000',
      null,
      'пн-вс 10:00-21:00'
    ]);
    rows.push(['998', 'Магазин с ошибкой', '', 'без города', 'не телефон', null, '']);
    const id = newId('imp');
    db.imports.set(id, { id, columns, rows });
    return response(201).json({
      import_id: id,
      columns,
      sample_rows: rows.slice(0, 5),
      row_count: rows.length
    });
  }),

  http.post('/locations/import/{id}/mapping', async ({ request, params, response }) => {
    await latency(500);
    const { db } = requirePermission(request, 'locations.edit');
    const imp = db.imports.get(params.id);
    if (!imp) return notFound('Import');
    const body = await request.json();
    imp.mapping = body.mapping;
    const col = (field: string) =>
      imp.columns.indexOf(Object.entries(body.mapping).find(([, f]) => f === field)?.[0] ?? '');
    const rows = imp.rows.map((r, i) => {
      const branch = col('branch_code') >= 0 ? r[col('branch_code')] : null;
      const name = col('name') >= 0 ? r[col('name')] : null;
      const city = col('address.city') >= 0 ? r[col('address.city')] : null;
      const phone = col('phones') >= 0 ? r[col('phones')] : null;
      const errors: string[] = [];
      if (!name) errors.push('Нет названия');
      if (!city) errors.push('Нет города');
      if (phone && !/^\+\d{10,15}$/.test(phone)) errors.push('Телефон не в формате E.164');
      const existing = db.locations.find((l) => l.branch_code === branch);
      return {
        row: i + 1,
        action: errors.length
          ? ('error' as const)
          : existing
            ? ('update' as const)
            : ('create' as const),
        location_id: existing?.id ?? null,
        branch_code: branch,
        name,
        changes: existing ? ['hours', 'phones'].filter(() => Math.random() > 0.5) : [],
        errors
      };
    });
    return response(200).json({
      import_id: imp.id,
      rows,
      summary: {
        create: rows.filter((r) => r.action === 'create').length,
        update: rows.filter((r) => r.action === 'update').length,
        error: rows.filter((r) => r.action === 'error').length
      }
    });
  }),

  http.post('/locations/import/{id}/apply', async ({ request, params, response }) => {
    await latency(500);
    const { db, user } = requirePermission(request, 'locations.edit');
    const imp = db.imports.get(params.id);
    if (!imp) return notFound('Import');
    const batch: Schema<'SyncBatch'> = {
      id: newId('bat'),
      kind: 'import',
      state: 'running',
      progress: { total: imp.rows.length, done: 0, failed: 0 },
      initiator_user_id: user.id,
      created_at: nowIso(),
      finished_at: null
    };
    db.batches.push(batch);
    db.batchItems.set(batch.id, []);
    let done = 0;
    const timer = setInterval(() => {
      done += 2;
      batch.progress.done = Math.min(imp.rows.length - 1, done);
      if (done >= imp.rows.length) {
        clearInterval(timer);
        batch.progress.failed = 1;
        batch.state = 'partially_failed';
        batch.finished_at = nowIso();
      }
    }, 500).unref();
    return response(202).json({ batch_id: batch.id });
  }),

  http.get('/location-groups', ({ request, response }) => {
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.groups;
    if (q.filters.kind?.length) items = items.filter((g) => q.filters.kind.includes(g.kind));
    if (q.q) items = items.filter((g) => g.name.toLowerCase().includes(q.q));
    return response(200).json({ items });
  }),

  http.post('/location-groups', async ({ request, response }) => {
    const { db } = requirePermission(request, 'locations.edit');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    const group: Schema<'LocationGroup'> = {
      id: newId('grp'),
      name: body.name,
      kind: body.kind,
      parent_id: body.parent_id ?? null,
      rule: body.rule ?? { location_ids: [] },
      location_count: body.rule?.location_ids?.length ?? 0
    };
    db.groups.push(group);
    for (const id of body.rule?.location_ids ?? [])
      db.locations.find((l) => l.id === id)?.group_ids.push(group.id);
    return response(201).json(group);
  }),

  http.get('/location-groups/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const g = db.groups.find((x) => x.id === params.id);
    return g ? response(200).json(g) : notFound('Group');
  }),

  http.put('/location-groups/{id}', async ({ request, params, response }) => {
    const { db } = requirePermission(request, 'locations.edit');
    const g = db.groups.find((x) => x.id === params.id);
    if (!g) return notFound('Group');
    const body = await request.json();
    Object.assign(g, {
      name: body.name,
      kind: body.kind,
      parent_id: body.parent_id ?? null,
      rule: body.rule ?? g.rule
    });
    if (body.rule?.location_ids) {
      for (const l of db.locations) l.group_ids = l.group_ids.filter((x) => x !== g.id);
      for (const id of body.rule.location_ids)
        db.locations.find((l) => l.id === id)?.group_ids.push(g.id);
    }
    recomputeGroups(db);
    return response(200).json(g);
  }),

  http.delete('/location-groups/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'locations.edit');
    const idx = db.groups.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Group');
    db.groups.splice(idx, 1);
    for (const l of db.locations) l.group_ids = l.group_ids.filter((x) => x !== params.id);
    return response(204).empty();
  }),

  http.get('/sync-batches/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const b = db.batches.find((x) => x.id === params.id);
    return b ? response(200).json(b) : notFound('Batch');
  }),

  http.get('/sync-batches/{id}/items', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (!db.batches.some((x) => x.id === params.id)) return notFound('Batch');
    const q = parseListQuery(request);
    let items = db.batchItems.get(params.id) ?? [];
    if (q.filters.state?.length) items = items.filter((i) => q.filters.state.includes(i.state));
    return response(200).json(paginate(items, q));
  }),

  http.post('/sync-batches/{id}/retry', async ({ request, params, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'locations.edit');
    const b = db.batches.find((x) => x.id === params.id);
    if (!b) return notFound('Batch');
    for (const item of db.batchItems.get(b.id) ?? []) {
      if (item.state === 'failed_terminal') {
        item.state = 'confirmed';
        item.error = null;
        b.progress.failed--;
        b.progress.done++;
        const l = db.listings.find((x) => x.id === item.listing_id);
        if (l) l.sync_status = 'synced';
      }
    }
    b.state = 'done';
    return response(202).json(b);
  }),

  // Listings — read model shared by S-LOC-01 stat cards and the "Площадки" tab.
  http.get('/listings/summary', async ({ request, response }) => {
    await latency(120);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const scoped = scopeLocationIds(db, q.scope);
    const platformKind = q.filters.platform_kind?.[0];
    const kindPlatforms = platformKind
      ? new Set(
          db.platforms
            .filter((p) =>
              platformKind === 'navigator' ? p.kind === 'navigator' : MAP_KINDS.includes(p.kind)
            )
            .map((p) => p.id)
        )
      : null;
    const counts: Schema<'ListingStatusCounts'> = {
      synced: 0,
      sent: 0,
      action_required: 0,
      not_connected: 0,
      unsupported: 0,
      error: 0,
      total: 0
    };
    const byPlatform = new Map<string, Schema<'ListingStatusCounts'>>();
    for (const l of db.listings) {
      if (scoped && (!l.location_id || !scoped.has(l.location_id))) continue;
      if (kindPlatforms && !kindPlatforms.has(l.platform_id)) continue;
      counts[l.sync_status]++;
      counts.total++;
      const c = byPlatform.get(l.platform_id) ?? {
        synced: 0,
        sent: 0,
        action_required: 0,
        not_connected: 0,
        unsupported: 0,
        error: 0,
        total: 0
      };
      c[l.sync_status]++;
      c.total++;
      byPlatform.set(l.platform_id, c);
    }
    return response(200).json({
      counts,
      by_platform: [...byPlatform].map(([platform_id, c]) => ({ platform_id, counts: c }))
    });
  }),

  http.get('/listings', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const f = q.filters;
    let items = db.listings.filter((l) => inScope(db, q.scope, l.location_id));
    if (f.platform_id?.length) items = items.filter((l) => f.platform_id.includes(l.platform_id));
    if (f.sync_status?.length) items = items.filter((l) => f.sync_status.includes(l.sync_status));
    if (f.action_reason?.length)
      items = items.filter((l) => l.action_reason && f.action_reason.includes(l.action_reason));
    if (f.match_state?.length) items = items.filter((l) => f.match_state.includes(l.match_state));
    if (f.location_id?.length)
      items = items.filter((l) => l.location_id && f.location_id.includes(l.location_id));
    if (q.q)
      items = items.filter((l) =>
        `${l.observed_name ?? ''} ${l.external_id ?? ''}`.toLowerCase().includes(q.q)
      );
    return response(200).json(paginate(sortBy(items, q.sort), q));
  }),

  http.get('/listings/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const l = db.listings.find((x) => x.id === params.id);
    return l ? response(200).json(l) : notFound('Listing');
  }),

  http.get('/listings/{id}/operations', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (!db.listings.some((x) => x.id === params.id)) return notFound('Listing');
    return response(200).json({ items: db.operations.filter((o) => o.listing_id === params.id) });
  }),

  http.post('/listings/{id}/actions', async ({ request, params, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'locations.edit');
    const l = db.listings.find((x) => x.id === params.id);
    if (!l) return notFound('Listing');
    const body = await request.json();
    if (body.action === 'disconnect') {
      l.sync_status = 'not_connected';
      l.action_reason = undefined;
      l.action_hint = null;
    } else {
      l.sync_status = 'sent';
      l.action_reason = undefined;
      l.action_hint = null;
      l.drift_fields = [];
      setTimeout(() => {
        l.sync_status = 'synced';
      }, 5000).unref();
    }
    return response(200).json(l);
  }),

  http.post('/listings/{id}/link', async ({ request, params, response }) => {
    await latency(200);
    const { db } = requirePermission(request, 'locations.edit');
    const l = db.listings.find((x) => x.id === params.id);
    if (!l) return notFound('Listing');
    const body = await request.json();
    if (!db.locations.some((x) => x.id === body.location_id)) return notFound('Location');
    l.location_id = body.location_id;
    l.match_state = 'confirmed';
    return response(200).json(l);
  })
];
