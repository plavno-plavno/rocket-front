import type { Schema } from '@lp/contracts';
import { CITIES } from '@mocks/db/geo';
import { KEYWORDS, TOPICS } from '@mocks/db/text';
import type { MockDb } from '@mocks/db';
import {
  http,
  latency,
  newId,
  nowIso,
  paginate,
  parseListQuery,
  requireSession,
  scopeLocationIds,
  type ListQuery
} from '@mocks/lib/http';

type Review = Schema<'Review'>;

function period(q: ListQuery, request: Request) {
  const sp = new URL(request.url).searchParams;
  const to = sp.get('to') ?? new Date().toISOString().slice(0, 10);
  const from = sp.get('from') ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
  return {
    from,
    to,
    compareFrom: sp.get('compare_from'),
    compareTo: sp.get('compare_to'),
    granularity: (sp.get('granularity') ?? 'day') as 'day' | 'week' | 'month',
    country: sp.get('country'),
    keyword: sp.get('keyword') ?? ''
  };
}

/** Reviews in scope, period and analytics filters (region / brand / city / platform). */
export function analyticsReviews(db: MockDb, q: ListQuery, from: string, to: string): Review[] {
  const scoped = scopeLocationIds(db, q.scope);
  const f = q.filters;
  const locById = new Map(db.locations.map((l) => [l.id, l]));
  return db.reviews.filter((r) => {
    const d = r.published_at.slice(0, 10);
    if (d < from || d > to) return false;
    if (scoped && !scoped.has(r.location_id)) return false;
    const loc = locById.get(r.location_id);
    if (!loc) return false;
    if (
      f.region?.[0] &&
      loc.address.region !== f.region[0] &&
      CITIES.find((c) => c.region_code === f.region[0])?.region !== loc.address.region
    )
      return false;
    if (f.brand_group_id?.[0] && loc.brand_group_id !== f.brand_group_id[0]) return false;
    if (f.city?.[0] && loc.address.city !== f.city[0]) return false;
    if (f.platform_id?.length && !f.platform_id.includes(r.platform_id)) return false;
    return true;
  });
}

function kpis(db: MockDb, items: Review[]) {
  const ids = new Set(items.map((r) => r.id));
  const answered = items.filter((r) => r.has_published_reply);
  const rt = items.map((r) => r.response_time_s).filter((x): x is number => typeof x === 'number');
  const rated = items.filter((r) => r.rating !== null);
  return {
    total: items.length,
    complaints: db.complaints.filter((c) => ids.has(c.review_id)).length,
    edited: items.filter((r) => r.current_version > 1).length,
    deleted: items.filter((r) => r.platform_state === 'deleted_by_author').length,
    answeredShare: items.length ? answered.length / items.length : null,
    avgResponse: rt.length ? Math.round(rt.reduce((s, x) => s + x, 0) / rt.length) : null,
    avgRating: rated.length
      ? Math.round((rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length) * 100) / 100
      : null
  };
}

const kpi = (value: number | null, previous: number | null | undefined): Schema<'KpiValue'> => ({
  value,
  previous: previous ?? null,
  delta_percent:
    previous && value !== null ? Math.round(((value - previous) / previous) * 1000) / 10 : null
});

function ranking(
  items: Review[],
  keyOf: (r: Review) => string | null,
  labelOf: (k: string) => string
): Schema<'RankingRow'>[] {
  const map = new Map<string, Review[]>();
  for (const r of items) {
    const k = keyOf(r);
    if (!k) continue;
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return [...map.entries()]
    .map(([key, rs]) => {
      const rated = rs.filter((r) => r.rating !== null);
      const avg = rated.length
        ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
        : null;
      return {
        key,
        label: labelOf(key),
        total: rs.length,
        positive: rs.filter((r) => (r.rating ?? 0) >= 4).length,
        negative: rs.filter((r) => r.rating !== null && r.rating <= 2).length,
        average_rating: avg === null ? null : Math.round(avg * 100) / 100,
        answered_share: rs.length
          ? Math.round((rs.filter((r) => r.has_published_reply).length / rs.length) * 100) / 100
          : null,
        trend_percent: null,
        sentiment:
          avg === null
            ? ('neutral' as const)
            : avg >= 4
              ? ('positive' as const)
              : avg >= 3
                ? ('neutral' as const)
                : ('negative' as const)
      };
    })
    .toSorted((a, b) => b.total - a.total);
}

export const handlers = [
  http.get('/analytics/reviews/summary', async ({ request, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const p = period(q, request);
    const cur = kpis(db, analyticsReviews(db, q, p.from, p.to));
    const prev =
      p.compareFrom && p.compareTo
        ? kpis(db, analyticsReviews(db, q, p.compareFrom, p.compareTo))
        : null;
    const items = analyticsReviews(db, q, p.from, p.to);
    const dist = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, none: 0 };
    for (const r of items) dist[r.rating === null ? 'none' : (String(r.rating) as '1')]++;
    return response(200).json({
      period: { from: p.from, to: p.to },
      total: kpi(cur.total, prev?.total),
      complaints: kpi(cur.complaints, prev?.complaints),
      edited_by_users: kpi(cur.edited, prev?.edited),
      deleted_by_users: kpi(cur.deleted, prev?.deleted),
      answered_share: kpi(cur.answeredShare, prev?.answeredShare),
      avg_response_time_s: kpi(cur.avgResponse, prev?.avgResponse),
      average_rating: kpi(cur.avgRating, prev?.avgRating),
      rating_distribution: dist
    });
  }),

  http.get('/analytics/reviews/trend', async ({ request, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const p = period(q, request);
    const items = analyticsReviews(db, q, p.from, p.to);
    const bucket = (d: string) =>
      p.granularity === 'month'
        ? d.slice(0, 7) + '-01'
        : p.granularity === 'week'
          ? weekStart(d)
          : d;
    const map = new Map<string, Review[]>();
    for (let d = new Date(p.from); d.toISOString().slice(0, 10) <= p.to; d.setDate(d.getDate() + 1))
      map.set(bucket(d.toISOString().slice(0, 10)), []);
    for (const r of items) {
      const b = bucket(r.published_at.slice(0, 10));
      map.set(b, [...(map.get(b) ?? []), r]);
    }
    const points: Schema<'TrendPoint'>[] = [...map.entries()]
      .toSorted(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, rs]) => {
        const rated = rs.filter((r) => r.rating !== null);
        return {
          date,
          total: rs.length,
          positive: rs.filter((r) => (r.rating ?? 0) >= 4).length,
          negative: rs.filter((r) => r.rating !== null && r.rating <= 2).length,
          neutral: rs.filter((r) => r.rating === 3).length,
          without_rating: rs.filter((r) => r.rating === null).length,
          average_rating: rated.length
            ? Math.round((rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length) * 100) /
              100
            : null,
          answered: rs.filter((r) => r.has_published_reply).length
        };
      });
    return response(200).json({ items: points });
  }),

  http.get('/analytics/reviews/regions', async ({ request, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const p = period(q, request);
    const items = analyticsReviews(db, q, p.from, p.to);
    const locById = new Map(db.locations.map((l) => [l.id, l]));
    const byRegion = new Map<string, Review[]>();
    for (const r of items) {
      const region = locById.get(r.location_id)?.address.region ?? '—';
      byRegion.set(region, [...(byRegion.get(region) ?? []), r]);
    }
    const rows: Schema<'RegionStat'>[] = [...byRegion.entries()].map(([region, rs]) => {
      const rated = rs.filter((r) => r.rating !== null);
      return {
        region_code: CITIES.find((c) => c.region === region)?.region_code ?? 'RU-XX',
        region_name: region,
        country: 'RU',
        total: rs.length,
        average_rating: rated.length
          ? Math.round((rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length) * 100) / 100
          : null,
        negative_share: rs.length
          ? Math.round(
              (rs.filter((r) => r.rating !== null && r.rating <= 2).length / rs.length) * 100
            ) / 100
          : null
      };
    });
    return response(200).json({ items: rows.filter((r) => !p.country || r.country === p.country) });
  }),

  ...(['locations', 'cities', 'tags', 'phrases', 'topics'] as const).map((dim) =>
    http.get(`/analytics/reviews/${dim}`, async ({ request, response }) => {
      await latency(200);
      const { db } = requireSession(request);
      const q = parseListQuery(request);
      const p = period(q, request);
      const items = analyticsReviews(db, q, p.from, p.to);
      const locById = new Map(db.locations.map((l) => [l.id, l]));
      const tagById = new Map(db.tags.map((t) => [t.id, t.name]));
      let rows: Schema<'RankingRow'>[];
      if (dim === 'locations')
        rows = ranking(
          items,
          (r) => r.location_id,
          (k) => locById.get(k)?.name ?? k
        );
      else if (dim === 'cities')
        rows = ranking(
          items,
          (r) => locById.get(r.location_id)?.address.city ?? null,
          (k) => k
        );
      else if (dim === 'tags')
        rows = items.flatMap((r) => r.tag_ids.map((t) => ({ ...r, tagRef: t }))).length
          ? ranking(
              items.flatMap((r) =>
                r.tag_ids.map(
                  (t) => ({ ...r, id: `${r.id}:${t}`, tagRef: t }) as Review & { tagRef: string }
                )
              ),
              (r) => (r as Review & { tagRef: string }).tagRef,
              (k) => tagById.get(k) ?? k
            )
          : [];
      else if (dim === 'topics')
        rows = ranking(
          items.flatMap((r) =>
            (r.aspects ?? []).map(
              (a) =>
                ({ ...r, id: `${r.id}:${a.topic}`, topicRef: a.topic }) as Review & {
                  topicRef: string;
                }
            )
          ),
          (r) => (r as Review & { topicRef: string }).topicRef,
          (k) => k
        );
      else
        rows = KEYWORDS.map((kw, i) => ({
          key: kw,
          label: kw,
          total: Math.max(1, Math.round(items.length / (i + 3))),
          positive: 0,
          negative: 0,
          average_rating: null,
          answered_share: null,
          trend_percent: null,
          sentiment: 'neutral' as const
        }));
      if (q.q) rows = rows.filter((r) => r.label.toLowerCase().includes(q.q));
      void TOPICS;
      return response(200).json(paginate(rows, q));
    })
  ),

  http.get('/analytics/reviews/staff', async ({ request, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const p = period(q, request);
    const items = analyticsReviews(db, q, p.from, p.to);
    const ids = new Set(items.map((r) => r.id));
    const rows: Schema<'StaffRow'>[] = db.memberships.map((m) => {
      const replies = db.replies.filter(
        (r) => r.author_user_id === m.user.id && ids.has(r.review_id) && r.state === 'published'
      );
      const rt = replies
        .map((r) => r.response_time_s)
        .filter((x): x is number => typeof x === 'number');
      return {
        user_id: m.user.id,
        name: m.user.name,
        replies: replies.length,
        avg_response_time_s: rt.length
          ? Math.round(rt.reduce((s, x) => s + x, 0) / rt.length)
          : null,
        resolved: items.filter(
          (r) => r.assignee_user_id === m.user.id && r.workflow_status === 'resolved'
        ).length,
        assigned_open: items.filter(
          (r) => r.assignee_user_id === m.user.id && r.workflow_status !== 'resolved'
        ).length
      };
    });
    return response(200).json(
      paginate(
        rows.toSorted((a, b) => b.replies - a.replies),
        q
      )
    );
  }),

  http.get('/analytics/reviews/concordance', async ({ request, response }) => {
    await latency(200);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const p = period(q, request);
    const kw = p.keyword.toLowerCase();
    const items = analyticsReviews(db, q, p.from, p.to).filter(
      (r) => kw && r.text?.toLowerCase().includes(kw)
    );
    const rows: Schema<'KwicRow'>[] = items.map((r) => {
      const text = r.text ?? '';
      const i = text.toLowerCase().indexOf(kw);
      return {
        review_id: r.id,
        left: text.slice(Math.max(0, i - 60), i),
        keyword: text.slice(i, i + kw.length),
        right: text.slice(i + kw.length, i + kw.length + 60),
        rating: r.rating,
        platform_id: r.platform_id,
        location_name: r.location_name ?? '',
        published_at: r.published_at
      };
    });
    return response(200).json(paginate(rows, q));
  }),

  http.post('/analytics/reviews/export', async ({ request, response }) => {
    await latency(300);
    const { db } = requireSession(request);
    const exp: Schema<'Export'> = {
      id: newId('exp'),
      kind: 'review_analytics',
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
