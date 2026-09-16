import { HttpResponse, type DefaultBodyType, type HttpResponseInit } from 'msw';
import { createOpenApiHttp } from 'openapi-msw';
import type { paths, Schema } from '@lp/contracts';
import type { MockDb } from '../db/types';
import { dbFor } from '../db';

/** Typed MSW `http` bound to the contract. Feature handlers import this, never `msw` directly. */
export const http = createOpenApiHttp<paths>();

export { HttpResponse };

type Problem = Schema<'Problem'>;

/** RFC 9457 problem response. */
export function problem(
  status: number,
  code: string,
  title: string,
  detail?: string,
  errors?: Problem['errors']
): HttpResponse<Problem> {
  const body: Problem = {
    type: `https://lp.example/problems/${code}`,
    title,
    status,
    code,
    detail,
    errors
  };
  return HttpResponse.json(body, {
    status,
    headers: { 'content-type': 'application/problem+json' }
  });
}

export const notFound = (what = 'Resource') => problem(404, 'not_found', `${what} not found`);
export const forbidden = (detail?: string) => problem(403, 'forbidden', 'Forbidden', detail);
export const unauthenticated = () => problem(401, 'unauthenticated', 'Authentication required');
export const validation = (errors: NonNullable<Problem['errors']>) =>
  problem(422, 'validation_failed', 'Validation failed', undefined, errors);
export const conflict = (detail: string) => problem(409, 'conflict', 'Conflict', detail);

import { SESSION_COOKIE } from './session-cookie';
export { SESSION_COOKIE, SESSION_HEADER } from './session-cookie';

export function readCookie(request: Request, name: string): string | undefined {
  const raw = request.headers.get('cookie');
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/** Returns the authenticated user or `null`. */
export function currentSession(request: Request, db: MockDb) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const session = db.sessions.get(token);
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return null;
  const membership = db.memberships.find((m) => m.user.id === user.id);
  return { session, user, membership };
}

/**
 * Authenticated context for a handler. Throws a 401 `HttpResponse` when unauthenticated —
 * MSW returns thrown responses as-is.
 */
export function requireSession(request: Request) {
  const db = dbFor(request);
  const ctx = currentSession(request, db);
  if (!ctx) throw unauthenticated();
  return { db, ...ctx };
}

export function requirePermission(request: Request, action: Schema<'Action'>) {
  const ctx = requireSession(request);
  const perms = rolePermissions(ctx.membership?.role ?? 'observer');
  if (!perms.includes(action)) throw forbidden(`Missing permission ${action}`);
  return ctx;
}

import { ROLE_PERMISSIONS } from '../db/seed-core';
export function rolePermissions(role: Schema<'Role'>): Schema<'Action'>[] {
  return ROLE_PERMISSIONS[role];
}

// ── list helpers ────────────────────────────────────────────────────────────

export interface ListQuery {
  page: number;
  pageSize: number;
  sort: { field: string; desc: boolean }[];
  q: string;
  scope: string;
  cursor: string | null;
  limit: number;
  filters: Record<string, string[]>;
}

export function parseListQuery(request: Request): ListQuery {
  const url = new URL(request.url);
  const sp = url.searchParams;
  const filters: Record<string, string[]> = {};
  for (const [k, v] of sp.entries()) {
    const m = /^filter\[(.+)\]$/.exec(k);
    if (m) (filters[m[1]] ??= []).push(...v.split(',').filter(Boolean));
  }
  return {
    page: Math.max(1, Number(sp.get('page') ?? 1)),
    pageSize: Math.min(200, Math.max(1, Number(sp.get('page_size') ?? 25))),
    sort: (sp.get('sort') ?? '')
      .split(',')
      .filter(Boolean)
      .map((s) =>
        s.startsWith('-') ? { field: s.slice(1), desc: true } : { field: s, desc: false }
      ),
    q: (sp.get('q') ?? '').trim().toLowerCase(),
    scope: sp.get('scope') ?? 'all',
    cursor: sp.get('cursor'),
    limit: Math.min(200, Math.max(1, Number(sp.get('limit') ?? 50))),
    filters
  };
}

export function sortBy<T>(
  items: T[],
  sort: ListQuery['sort'],
  accessor: (item: T, field: string) => unknown = (i, f) => (i as Record<string, unknown>)[f]
): T[] {
  if (!sort.length) return items;
  return items.toSorted((a, b) => {
    for (const s of sort) {
      const av = accessor(a, s.field);
      const bv = accessor(b, s.field);
      if (av === bv) continue;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = av < bv ? -1 : 1;
      return s.desc ? -cmp : cmp;
    }
    return 0;
  });
}

export function paginate<T>(items: T[], q: ListQuery): { items: T[]; meta: Schema<'PageMeta'> } {
  const start = (q.page - 1) * q.pageSize;
  return {
    items: items.slice(start, start + q.pageSize),
    meta: { page: q.page, page_size: q.pageSize, total: items.length }
  };
}

/** Cursor pagination over an already-ordered list; cursor = offset encoded as base64. */
export function cursorPaginate<T>(
  items: T[],
  q: ListQuery
): { items: T[]; meta: Schema<'CursorMeta'> } {
  const offset = q.cursor ? Number(Buffer.from(q.cursor, 'base64').toString('utf8')) || 0 : 0;
  const slice = items.slice(offset, offset + q.limit);
  const nextOffset = offset + q.limit;
  return {
    items: slice,
    meta: {
      next_cursor:
        nextOffset < items.length ? Buffer.from(String(nextOffset)).toString('base64') : null
    }
  };
}

/** Location ids inside a `scope` (`all` or a group id). */
export function scopeLocationIds(db: MockDb, scope: string): Set<string> | null {
  if (!scope || scope === 'all') return null;
  const ids = scope.split(',').filter(Boolean);
  const out = new Set<string>();
  for (const gid of ids) {
    const group = db.groups.find((g) => g.id === gid);
    if (!group) continue;
    for (const loc of db.locations) if (loc.group_ids?.includes(gid)) out.add(loc.id);
  }
  return out;
}

export function inScope(db: MockDb, scope: string, locationId: string | null | undefined): boolean {
  const set = scopeLocationIds(db, scope);
  return !set || (!!locationId && set.has(locationId));
}

export function json<T extends DefaultBodyType>(body: T, init?: HttpResponseInit) {
  return HttpResponse.json(body, init);
}

export function nowIso() {
  return new Date().toISOString();
}

let counter = 0;
export function newId(prefix: string): string {
  counter++;
  const t = Date.now().toString(36).toUpperCase();
  return `${prefix}_${(t + counter.toString(36).toUpperCase()).padEnd(26, 'Z').slice(0, 26)}`;
}

/** Simulates latency; disabled in tests via MOCK_LATENCY=0. */
export async function latency(ms = 120) {
  const factor = Number(process.env.MOCK_LATENCY ?? '1');
  if (factor <= 0) return;
  await new Promise((r) => setTimeout(r, ms * factor));
}
