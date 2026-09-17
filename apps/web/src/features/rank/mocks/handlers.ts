import type { Schema } from '@lp/contracts';
import type { MockDb } from '@mocks/db';
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
  validation
} from '@mocks/lib/http';
import { Random } from '@mocks/lib/random';

const COMPETITORS = [
  'Спортмастер',
  'Декатлон',
  'Кант',
  'Триал-Спорт',
  'Профи Спорт',
  'Планета Спорт',
  'Экип',
  'Спортландия'
];

/** Locations of a project: explicit `location_ids` or everything in its scope. */
function projectLocations(db: MockDb, p: Schema<'RankProject'>) {
  if (p.location_ids?.length) return db.locations.filter((l) => p.location_ids!.includes(l.id));
  const scoped = scopeLocationIds(db, p.scope);
  return db.locations.filter((l) => !l.deleted_at && (!scoped || scoped.has(l.id)));
}

function seedOf(...parts: string[]) {
  let h = 2166136261;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Deterministic heatmap: ranks improve towards the centre and with the keyword's position in the project. */
function heatmap(
  db: MockDb,
  p: Schema<'RankProject'>,
  locationId: string,
  keyword: string,
  platformId: string,
  date: string
): Schema<'RankHeatmap'> | null {
  const loc = db.locations.find((l) => l.id === locationId);
  if (!loc?.geo) return null;
  const rnd = new Random(seedOf(p.id, locationId, keyword, platformId, date));
  const size = p.grid.size;
  const stepDeg = (p.grid.radius_m / 111_000) * (2 / (size - 1));
  const half = (size - 1) / 2;
  const kwBias = Math.max(0, p.keywords.indexOf(keyword)) * 0.6;
  const cells: Schema<'RankHeatmapCell'>[] = [];
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++) {
      const dist = Math.hypot(row - half, col - half) / Math.max(1, half);
      const raw = 1 + dist * 9 + kwBias + rnd.float(-1.5, 2.5);
      const rank = raw > 20 ? null : Math.max(1, Math.round(raw));
      cells.push({
        lat: loc.geo.lat + (row - half) * stepDeg,
        lng: loc.geo.lng + (col - half) * stepDeg * 1.6,
        rank,
        top_results: rnd.sample(COMPETITORS, 3).map((name, i) => ({
          external_id: `cmp_${i}`,
          name
        }))
      });
    }
  const ranked = cells.map((c) => c.rank).filter((r): r is number => r !== null);
  return {
    project_id: p.id,
    location_id: locationId,
    platform_id: platformId,
    keyword,
    captured_at: `${date}T09:00:00Z`,
    center: { lat: loc.geo.lat, lng: loc.geo.lng },
    cells,
    arp: ranked.length
      ? Math.round((ranked.reduce((s, r) => s + r, 0) / ranked.length) * 10) / 10
      : null,
    solv:
      Math.round(
        (cells.filter((c) => c.rank !== null && c.rank <= 3).length / cells.length) * 100
      ) / 100
  };
}

function project(db: MockDb, id: string) {
  return db.rankProjects.find((p) => p.id === id);
}

export const handlers = [
  http.get('/rank-projects', ({ request, response }) => {
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    let items = db.rankProjects;
    if (q.q) items = items.filter((p) => p.name.toLowerCase().includes(q.q));
    return response(200).json(paginate(items, q));
  }),

  http.post('/rank-projects', async ({ request, response }) => {
    await latency(300);
    const { db } = requirePermission(request, 'analytics.read');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    if (!body.keywords?.length)
      return validation([{ field: 'keywords', message: 'Добавьте хотя бы одно ключевое слово' }]);
    if (!body.platform_ids?.length)
      return validation([{ field: 'platform_ids', message: 'Выберите площадку' }]);
    const p: Schema<'RankProject'> = {
      id: newId('rnk'),
      name: body.name.trim(),
      platform_ids: body.platform_ids,
      keywords: body.keywords,
      grid: body.grid,
      schedule: body.schedule,
      scope: body.scope ?? 'all',
      location_ids: body.location_ids ?? [],
      status: 'active',
      last_run_at: null,
      created_at: nowIso()
    };
    db.rankProjects.unshift(p);
    return response(201).json(p);
  }),

  http.get('/rank-projects/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const p = project(db, params.id);
    return p ? response(200).json(p) : notFound('RankProject');
  }),

  http.put('/rank-projects/{id}', async ({ request, params, response }) => {
    await latency(250);
    const { db } = requirePermission(request, 'analytics.read');
    const p = project(db, params.id);
    if (!p) return notFound('RankProject');
    const body = await request.json();
    Object.assign(p, {
      name: body.name,
      platform_ids: body.platform_ids,
      keywords: body.keywords,
      grid: body.grid,
      schedule: body.schedule,
      scope: body.scope ?? 'all',
      location_ids: body.location_ids ?? []
    });
    return response(200).json(p);
  }),

  http.delete('/rank-projects/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'analytics.read');
    const idx = db.rankProjects.findIndex((p) => p.id === params.id);
    if (idx < 0) return notFound('RankProject');
    db.rankProjects.splice(idx, 1);
    return response(204).empty();
  }),

  http.post('/rank-projects/{id}/run', async ({ request, params, response }) => {
    await latency(800);
    const { db } = requirePermission(request, 'analytics.read');
    const p = project(db, params.id);
    if (!p) return notFound('RankProject');
    p.last_run_at = nowIso();
    return response(202).empty();
  }),

  http.get('/rank-projects/{id}/heatmap', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const p = project(db, params.id);
    if (!p) return notFound('RankProject');
    const sp = new URL(request.url).searchParams;
    const locs = projectLocations(db, p);
    const locationId = sp.get('location_id') ?? locs[0]?.id ?? '';
    const keyword = sp.get('keyword') ?? p.keywords[0] ?? '';
    const platformId = sp.get('platform_id') ?? p.platform_ids[0] ?? '';
    const date = sp.get('date') ?? (p.last_run_at ?? nowIso()).slice(0, 10);
    const hm = heatmap(db, p, locationId, keyword, platformId, date);
    return hm ? response(200).json(hm) : notFound('Location');
  }),

  http.get('/rank-projects/{id}/trend', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const p = project(db, params.id);
    if (!p) return notFound('RankProject');
    const sp = new URL(request.url).searchParams;
    const locs = projectLocations(db, p);
    const locationId = sp.get('location_id') ?? locs[0]?.id ?? '';
    const keyword = sp.get('keyword') ?? p.keywords[0] ?? '';
    const platformId = sp.get('platform_id') ?? p.platform_ids[0] ?? '';
    const to = sp.get('to') ?? nowIso().slice(0, 10);
    const from =
      sp.get('from') ?? new Date(Date.now() - 89 * 86_400_000).toISOString().slice(0, 10);
    const step = p.schedule === 'daily' ? 1 : p.schedule === 'monthly' ? 30 : 7;
    const items: Schema<'RankTrendPoint'>[] = [];
    for (
      let d = new Date(from);
      d.toISOString().slice(0, 10) <= to;
      d.setDate(d.getDate() + step)
    ) {
      const date = d.toISOString().slice(0, 10);
      const hm = heatmap(db, p, locationId, keyword, platformId, date);
      items.push({ date, arp: hm?.arp ?? null, solv: hm?.solv ?? null });
    }
    return response(200).json({ items });
  }),

  http.get('/rank-projects/{id}/competitors', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const p = project(db, params.id);
    if (!p) return notFound('RankProject');
    const q = parseListQuery(request);
    const rnd = new Random(seedOf(p.id, 'competitors'));
    const items: Schema<'Competitor'>[] = COMPETITORS.map((name, i) => ({
      external_id: `cmp_${i}`,
      name,
      appearances: rnd.int(5, 60),
      avg_rank: Math.round(rnd.float(1.5, 12) * 10) / 10
    })).toSorted((a, b) => b.appearances - a.appearances);
    return response(200).json(paginate(items, q));
  })
];
