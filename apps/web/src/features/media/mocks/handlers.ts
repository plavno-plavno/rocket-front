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
  scopeLocationIds,
  sortBy,
  validation
} from '@mocks/lib/http';

export const handlers = [
  http.get('/media', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.mediaAssets;
    if (q.filters.kind?.length) items = items.filter((m) => q.filters.kind.includes(m.kind));
    if (q.filters.location_id?.length)
      items = items.filter((m) =>
        (m.location_ids ?? []).some((id) => q.filters.location_id.includes(id))
      );
    return response(200).json(
      paginate(sortBy(items, q.sort.length ? q.sort : [{ field: 'created_at', desc: true }]), q)
    );
  }),

  http.post('/media', async ({ request, response }) => {
    await latency(600);
    const { db } = requirePermission(request, 'locations.edit');
    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) return validation([{ field: 'file', message: 'Выберите файл' }]);
    const kind = (form?.get('kind') as Schema<'MediaKind'> | null) ?? 'photo';
    const locationIds = String(form?.get('location_ids') ?? '')
      .split(',')
      .filter(Boolean);
    const n = db.mediaAssets.length + 1;
    const asset: Schema<'MediaAsset'> = {
      id: newId('med'),
      kind,
      url: `https://picsum.photos/seed/up-${n}/1200/800`,
      thumbnail_url: `https://picsum.photos/seed/up-${n}/300/200`,
      width: 1200,
      height: 800,
      size_bytes: file.size,
      location_ids: locationIds,
      created_at: nowIso()
    };
    db.mediaAssets.unshift(asset);
    return response(201).json(asset);
  }),

  http.delete('/media/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'locations.edit');
    const idx = db.mediaAssets.findIndex((m) => m.id === params.id);
    if (idx < 0) return notFound('MediaAsset');
    db.mediaAssets.splice(idx, 1);
    return response(204).empty();
  }),

  http.get('/media/listing-media', async ({ request, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const scoped = scopeLocationIds(db, q.scope);
    let items = db.listingMedia.filter((m) => !scoped || scoped.has(m.location_id));
    if (q.filters.platform_id?.length)
      items = items.filter((m) => q.filters.platform_id.includes(m.platform_id));
    if (q.filters.origin?.length) items = items.filter((m) => q.filters.origin.includes(m.origin));
    if (q.filters.state?.length) items = items.filter((m) => q.filters.state.includes(m.state));
    if (q.filters.location_id?.length)
      items = items.filter((m) => q.filters.location_id.includes(m.location_id));
    return response(200).json(
      paginate(sortBy(items, q.sort.length ? q.sort : [{ field: 'observed_at', desc: true }]), q)
    );
  }),

  http.post('/media/listing-media/{id}/actions', async ({ request, params, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'locations.edit');
    const m = db.listingMedia.find((x) => x.id === params.id);
    if (!m) return notFound('ListingMedia');
    const body = await request.json();
    if (body.action === 'flag') m.state = 'flagged';
    else db.listingMedia.splice(db.listingMedia.indexOf(m), 1);
    return response(200).json(m);
  })
];
