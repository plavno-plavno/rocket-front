import type { Schema } from '@lp/contracts';
import { dbFor, getDb, SEED_TOTP, type MockDb } from '@mocks/db';
import {
  currentSession,
  http,
  json,
  latency,
  newId,
  nowIso,
  problem,
  requireSession,
  rolePermissions,
  SESSION_HEADER,
  unauthenticated,
  validation
} from '@mocks/lib/http';

/** See SESSION_HEADER: the express layer converts this into a real Set-Cookie. */
function sessionHeaders(token: string) {
  return { [SESSION_HEADER]: token };
}

function createSession(db: MockDb, userId: string, tenantId: string) {
  const token = newId('ses');
  db.sessions.set(token, { token, userId, tenantId, createdAt: nowIso() });
  return token;
}

function buildMe(db: MockDb, userId: string): Schema<'Me'> {
  const user = db.users.find((u) => u.id === userId)!;
  const membership = db.memberships.find((m) => m.user.id === userId);
  const role = membership?.role ?? 'observer';
  const rule = membership?.access_rule ?? { mode: 'all' as const };
  const locationCount =
    rule.mode === 'all'
      ? db.locations.length
      : rule.mode === 'locations'
        ? (rule.location_ids?.length ?? 0)
        : db.locations.filter((l) => l.group_ids?.some((g) => rule.group_ids?.includes(g))).length;
  return {
    user,
    tenant: db.tenant,
    role,
    access_rule: { mode: rule.mode, location_count: locationCount },
    permissions: rolePermissions(role),
    tenants: db.tenants
  };
}

export const handlers = [
  http.post('/auth/sign-in', async ({ request, response }) => {
    await latency(300);
    const db = dbFor(request);
    const body = await request.json();
    const user = db.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
    if (!user || db.passwords.get(user.id) !== body.password) {
      return problem(401, 'invalid_credentials', 'Неверный email или пароль');
    }
    if (user.status === 'disabled') return problem(403, 'user_disabled', 'Пользователь отключён');
    if (user.two_factor_enabled) {
      const challenge = newId('chl');
      db.twoFactorChallenges.set(challenge, user.id);
      return response(200).json({ status: 'two_factor_required', challenge_token: challenge });
    }
    const token = createSession(db, user.id, db.tenant.id);
    return response(200).json({ status: 'ok' }, { headers: sessionHeaders(token) });
  }),

  http.post('/auth/2fa', async ({ request, response }) => {
    await latency(200);
    const db = dbFor(request);
    const body = await request.json();
    const userId = db.twoFactorChallenges.get(body.challenge_token);
    if (!userId) return problem(401, 'challenge_expired', 'Сессия подтверждения истекла');
    if (body.code !== SEED_TOTP) return validation([{ field: 'code', message: 'Неверный код' }]);
    db.twoFactorChallenges.delete(body.challenge_token);
    const token = createSession(db, userId, db.tenant.id);
    return response(200).json({ status: 'ok' }, { headers: sessionHeaders(token) });
  }),

  http.post('/auth/sign-out', ({ request, response }) => {
    const db = dbFor(request);
    const ctx = currentSession(request, db);
    if (ctx) db.sessions.delete(ctx.session.token);
    return response(204).empty({ headers: sessionHeaders('') });
  }),

  http.post('/auth/password-reset', async ({ request, response }) => {
    await latency(300);
    await request.json();
    return response(202).empty();
  }),

  http.post('/auth/password-reset/confirm', async ({ request, response }) => {
    await latency(300);
    const body = await request.json();
    if (body.token === 'expired') return problem(410, 'token_expired', 'Ссылка устарела');
    return response(204).empty();
  }),

  http.get('/auth/invitations/{token}', ({ request, params, response }) => {
    const db = dbFor(request);
    if (params.token === 'expired') return problem(410, 'token_expired', 'Приглашение истекло');
    const inv = db.invitations[0];
    return response(200).json({
      email: inv?.email ?? 'newcolleague@example.ru',
      tenant_name: db.tenant.name,
      role: inv?.role ?? 'reputation_manager',
      expires_at: inv?.expires_at ?? nowIso()
    });
  }),

  http.post('/auth/invitations/{token}/accept', async ({ request, params, response }) => {
    await latency(300);
    const db = dbFor(request);
    if (params.token === 'expired') return problem(410, 'token_expired', 'Приглашение истекло');
    const body = await request.json();
    const inv = db.invitations[0];
    const user: Schema<'User'> = {
      id: newId('usr'),
      email: inv?.email ?? 'newcolleague@example.ru',
      name: body.name,
      avatar_url: null,
      locale: 'ru',
      status: 'active',
      two_factor_enabled: false
    };
    db.users.push(user);
    db.passwords.set(user.id, body.password);
    db.memberships.push({
      user,
      role: inv?.role ?? 'reputation_manager',
      access_rule: inv?.access_rule ?? { mode: 'all' },
      status: 'active',
      last_login_at: nowIso(),
      invited_at: inv?.created_at ?? nowIso()
    });
    if (inv) inv.accepted_at = nowIso();
    const token = createSession(db, user.id, db.tenant.id);
    return response(200).json({ status: 'ok' }, { headers: sessionHeaders(token) });
  }),

  http.get('/me', async ({ request, response }) => {
    await latency(80);
    const db = dbFor(request);
    const ctx = currentSession(request, db);
    if (!ctx) return unauthenticated();
    return response(200).json(buildMe(db, ctx.user.id));
  }),

  http.patch('/me', async ({ request, response }) => {
    const { db, user } = requireSession(request);
    const body = await request.json();
    Object.assign(user, {
      name: body.name ?? user.name,
      locale: body.locale ?? user.locale,
      avatar_url: body.avatar_url === undefined ? user.avatar_url : body.avatar_url
    });
    void db;
    return response(200).json(user);
  }),

  http.post('/me/password', async ({ request, response }) => {
    const { db, user } = requireSession(request);
    const body = await request.json();
    if (db.passwords.get(user.id) !== body.current_password)
      return validation([{ field: 'current_password', message: 'Неверный текущий пароль' }]);
    db.passwords.set(user.id, body.new_password);
    return response(204).empty();
  }),

  http.get('/me/badges', ({ request, response }) => {
    const { db } = requireSession(request);
    return response(200).json({
      reviews_unanswered: db.reviews.filter(
        (r) =>
          !r.has_published_reply &&
          r.workflow_status !== 'no_reply_needed' &&
          r.platform_state !== 'deleted_by_author'
      ).length,
      duplicates_open: db.duplicates.filter((d) => d.state === 'open').length,
      action_required: db.listings.filter((l) => l.sync_status === 'action_required').length,
      notifications_unread: db.notifications.filter((n) => !n.read).length
    });
  }),

  http.post('/me/switch-tenant', async ({ request, response }) => {
    await latency(200);
    const { db, user, session } = requireSession(request);
    const body = await request.json();
    const target = db.tenants.find((t) => t.id === body.tenant_id);
    if (!target) return problem(404, 'not_found', 'Tenant not found');
    session.tenantId = target.id;
    const me = buildMe(db, user.id);
    // The demo second tenant shares data but reports another name/role, enough for the switcher UX.
    return response(200).json({
      ...me,
      tenant: { ...me.tenant, id: target.id, name: target.name },
      role: target.role
    });
  }),

  http.get('/tenants/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (params.id !== db.tenant.id) return problem(404, 'not_found', 'Tenant not found');
    return response(200).json(db.tenant);
  }),

  http.patch('/tenants/{id}', async ({ request, params, response }) => {
    const { db } = requireSession(request);
    if (params.id !== db.tenant.id) return problem(404, 'not_found', 'Tenant not found');
    const body = await request.json();
    Object.assign(db.tenant, body);
    return response(200).json(db.tenant);
  })
];

/** Used by e2e helpers to log in without the UI. */
export function createSessionFor(
  email: string,
  scenario: Parameters<typeof getDb>[0] = 'seed_default'
) {
  const db = getDb(scenario);
  const user = db.users.find((u) => u.email === email);
  if (!user) throw new Error(`No seeded user ${email}`);
  return createSession(db, user.id, db.tenant.id);
}

export { json };
