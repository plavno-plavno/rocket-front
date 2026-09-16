import type { Schema } from '@lp/contracts';
import { Random } from '@mocks/lib/random';
import { KEYWORDS } from '@mocks/db/text';
import type { MockDb } from '@mocks/db';
import {
  http,
  latency,
  newId,
  notFound,
  nowIso,
  paginate,
  parseListQuery,
  requireSession,
  scopeLocationIds
} from '@mocks/lib/http';

const METRIC_PLATFORMS = ['plt_google', 'plt_yandex', 'plt_2gis'];

function range(request: Request) {
  const sp = new URL(request.url).searchParams;
  const to = sp.get('to') ?? new Date().toISOString().slice(0, 10);
  const from = sp.get('from') ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
  return {
    from,
    to,
    compareFrom: sp.get('compare_from'),
    compareTo: sp.get('compare_to'),
    granularity: (sp.get('granularity') ?? 'day') as 'day' | 'week' | 'month',
    month: sp.get('month')
  };
}

/** Deterministic synthetic daily metrics: seeded by date + scope size so periods are comparable. */
function series(
  db: MockDb,
  scope: string,
  platforms: string[],
  from: string,
  to: string
): Schema<'PresencePoint'>[] {
  const scoped = scopeLocationIds(db, scope);
  const n = scoped ? scoped.size : db.locations.length;
  const out: Schema<'PresencePoint'>[] = [];
  for (let d = new Date(from); d.toISOString().slice(0, 10) <= to; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    const rnd = new Random(Number(date.replace(/-/g, '')) + platforms.length);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const base = n * platforms.length * (weekend ? 34 : 48);
    const maps = Math.round(base * rnd.float(0.55, 0.7));
    const search = Math.round(base * rnd.float(0.3, 0.45));
    const calls = Math.round((maps + search) * rnd.float(0.012, 0.02));
    const website = Math.round((maps + search) * rnd.float(0.015, 0.03));
    const directions = Math.round((maps + search) * rnd.float(0.02, 0.035));
    const other = Math.round((maps + search) * rnd.float(0.003, 0.008));
    out.push({
      date,
      impressions_maps: maps,
      impressions_search: search,
      impressions_total: maps + search,
      actions_calls: calls,
      actions_website: website,
      actions_directions: directions,
      actions_other: other
    });
  }
  return out;
}

function summarize(points: Schema<'PresencePoint'>[]) {
  const s = (k: keyof Schema<'PresencePoint'>) =>
    points.reduce((a, p) => a + (Number(p[k]) || 0), 0);
  const impressions = s('impressions_total');
  const calls = s('actions_calls');
  const website = s('actions_website');
  const directions = s('actions_directions');
  const other = s('actions_other');
  const actions = calls + website + directions + other;
  return {
    impressions,
    actions,
    conversion: impressions ? Math.round((actions / impressions) * 10000) / 10000 : null,
    by_action: { calls, website, directions, other }
  };
}

const kpi = (value: number | null, previous?: number | null): Schema<'KpiValue'> => ({
  value,
  previous: previous ?? null,
  delta_percent:
    previous && value !== null ? Math.round(((value - previous) / previous) * 1000) / 10 : null
});

function summaryFor(db: MockDb, request: Request, platformIds?: string[]) {
  const q = parseListQuery(request);
  const r = range(request);
  const platforms = (platformIds ?? q.filters.platform_id ?? []).length
    ? (platformIds ?? q.filters.platform_id).filter((p) => METRIC_PLATFORMS.includes(p))
    : METRIC_PLATFORMS;
  const cur = summarize(series(db, q.scope, platforms, r.from, r.to));
  const prev =
    r.compareFrom && r.compareTo
      ? summarize(series(db, q.scope, platforms, r.compareFrom, r.compareTo))
      : null;
  const summary: Schema<'PresenceSummary'> = {
    period: { from: r.from, to: r.to },
    impressions: kpi(cur.impressions, prev?.impressions),
    actions: kpi(cur.actions, prev?.actions),
    conversion: kpi(cur.conversion, prev?.conversion),
    by_action: cur.by_action,
    platforms_without_data: db.platforms
      .filter(
        (p) => !METRIC_PLATFORMS.includes(p.id) && (!platformIds || platformIds.includes(p.id))
      )
      .map((p) => p.id)
  };
  return { summary, platforms, q, r };
}

function bucketize(
  points: Schema<'PresencePoint'>[],
  granularity: 'day' | 'week' | 'month'
): Schema<'PresencePoint'>[] {
  if (granularity === 'day') return points;
  const map = new Map<string, Schema<'PresencePoint'>>();
  for (const p of points) {
    const key = granularity === 'month' ? p.date.slice(0, 7) + '-01' : weekStart(p.date);
    const acc = map.get(key) ?? {
      date: key,
      impressions_maps: 0,
      impressions_search: 0,
      impressions_total: 0,
      actions_calls: 0,
      actions_website: 0,
      actions_directions: 0,
      actions_other: 0
    };
    for (const k of [
      'impressions_maps',
      'impressions_search',
      'impressions_total',
      'actions_calls',
      'actions_website',
      'actions_directions',
      'actions_other'
    ] as const)
      acc[k] = (acc[k] ?? 0) + (p[k] ?? 0);
    map.set(key, acc);
  }
  return [...map.values()];
}

export const handlers = [
  http.get('/analytics/presence/summary', async ({ request, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    return response(200).json(summaryFor(db, request).summary);
  }),

  http.get('/analytics/presence/trend', async ({ request, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    const { platforms, q, r } = summaryFor(db, request);
    return response(200).json({
      items: bucketize(series(db, q.scope, platforms, r.from, r.to), r.granularity)
    });
  }),

  http.get('/analytics/presence/sync', async ({ request, response }) => {
    await latency(150);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const scoped = scopeLocationIds(db, q.scope);
    const cells: Schema<'PresenceSyncCell'>[] = db.platforms.map((p) => {
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
        if (l.platform_id !== p.id) continue;
        if (scoped && (!l.location_id || !scoped.has(l.location_id))) continue;
        counts[l.sync_status]++;
        counts.total++;
      }
      return { platform_id: p.id, counts };
    });
    return response(200).json({ items: cells });
  }),

  http.get('/analytics/presence/platforms/{platformId}', async ({ request, params, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    if (!db.platforms.some((p) => p.id === params.platformId)) return notFound('Platform');
    const { summary, q, r } = summaryFor(db, request, [params.platformId]);
    const trend = METRIC_PLATFORMS.includes(params.platformId)
      ? bucketize(series(db, q.scope, [params.platformId], r.from, r.to), r.granularity)
      : [];
    return response(200).json({ summary, trend });
  }),

  http.get('/analytics/presence/keywords', async ({ request, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const r = range(request);
    const month: string = r.month ?? new Date().toISOString().slice(0, 7);
    const scoped = scopeLocationIds(db, q.scope);
    const n = scoped ? scoped.size : db.locations.length;
    const rnd = new Random(Number(month.replace('-', '')));
    let rows: Schema<'KeywordRow'>[] = KEYWORDS.flatMap((kw, i) =>
      METRIC_PLATFORMS.map((p) => ({
        keyword: kw,
        impressions: Math.round(((n * 40) / (i + 1)) * rnd.float(0.6, 1.4)),
        month,
        platform_id: p,
        trend_percent: Math.round(rnd.float(-30, 40))
      }))
    );
    const platformFilter = q.filters.platform_id ?? [];
    if (platformFilter.length)
      rows = rows.filter((x) => x.platform_id && platformFilter.includes(x.platform_id));
    if (q.q) rows = rows.filter((x) => x.keyword.includes(q.q));
    return response(200).json(
      paginate(
        rows.toSorted((a, b) => b.impressions - a.impressions),
        q
      )
    );
  }),

  http.post('/analytics/presence/export', async ({ request, response }) => {
    await latency(300);
    const { db } = requireSession(request);
    const exp: Schema<'Export'> = {
      id: newId('exp'),
      kind: 'presence',
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
    }, 2500).unref();
    return response(202).json(exp);
  })
];

function weekStart(d: string) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date.toISOString().slice(0, 10);
}
