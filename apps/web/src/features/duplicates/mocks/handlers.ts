import {
  http,
  latency,
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
  http.get('/duplicates', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const scoped = scopeLocationIds(db, q.scope);
    let items = db.duplicates.filter((d) => !scoped || scoped.has(d.location_id));
    if (q.q)
      items = items.filter((d) =>
        `${d.location_name} ${d.listing.observed_name ?? ''}`.toLowerCase().includes(q.q)
      );
    if (q.filters.kind?.length) items = items.filter((d) => q.filters.kind.includes(d.kind));
    if (q.filters.state?.length) items = items.filter((d) => q.filters.state.includes(d.state));
    if (q.filters.platform_id?.length)
      items = items.filter((d) => q.filters.platform_id.includes(d.platform_id));
    return response(200).json(
      paginate(sortBy(items, q.sort.length ? q.sort : [{ field: 'score', desc: true }]), q)
    );
  }),

  http.get('/duplicates/summary', ({ request, response }) => {
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const scoped = scopeLocationIds(db, q.scope);
    const open = db.duplicates.filter(
      (d) => d.state === 'open' && (!scoped || scoped.has(d.location_id))
    );
    return response(200).json({
      open: open.length,
      duplicates: open.filter((d) => d.kind === 'duplicate').length,
      fakes: open.filter((d) => d.kind === 'fake').length,
      conflicting_owner: open.filter((d) => d.kind === 'conflicting_owner').length
    });
  }),

  http.get('/duplicates/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const d = db.duplicates.find((x) => x.id === params.id);
    return d ? response(200).json(d) : notFound('DuplicateCase');
  }),

  http.post('/duplicates/{id}/actions', async ({ request, params, response }) => {
    await latency(400);
    const { db } = requirePermission(request, 'locations.edit');
    const d = db.duplicates.find((x) => x.id === params.id);
    if (!d) return notFound('DuplicateCase');
    const body = await request.json();
    const map = {
      confirm_duplicate: 'confirmed',
      dismiss: 'dismissed',
      report_fake: 'reported',
      merge: 'merged',
      claim: 'confirmed'
    } as const;
    const next = map[body.action as keyof typeof map];
    if (!next) return validation([{ field: 'action', message: 'Неизвестное действие' }]);
    d.state = next;
    d.resolved_at = nowIso();
    return response(200).json(d);
  })
];
