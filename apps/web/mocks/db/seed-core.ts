import type { Schema } from '@lp/contracts';
import { Random, isoDaysAgo } from '../lib/random';
import { CITIES, MALLS, STREETS } from './geo';
import { PLATFORMS } from './platforms';
import type { MockDb, Scenario } from './types';

type Location = Schema<'Location'>;
type Listing = Schema<'Listing'>;
type SyncStatus = Schema<'SyncStatus'>;
type ActionReason = Schema<'ActionReason'>;

export const TENANT_ID = 'tnt_01J8SEEDTENANT0000000000001';
export const SECOND_TENANT_ID = 'tnt_01J8SEEDTENANT0000000000002';
export const LOCATION_COUNT = 107;

export const SEED_USERS = [
  {
    id: 'usr_01J8SEEDUSER00000000000001',
    email: 'owner@example.ru',
    name: 'Ирина Соколова',
    role: 'owner' as const,
    twoFactor: false
  },
  {
    id: 'usr_01J8SEEDUSER00000000000002',
    email: 'admin@example.ru',
    name: 'Павел Кузнецов',
    role: 'admin' as const,
    twoFactor: true
  },
  {
    id: 'usr_01J8SEEDUSER00000000000003',
    email: 'manager@example.ru',
    name: 'Алина Морозова',
    role: 'reputation_manager' as const,
    twoFactor: false
  },
  {
    id: 'usr_01J8SEEDUSER00000000000004',
    email: 'manager2@example.ru',
    name: 'Денис Волков',
    role: 'reputation_manager' as const,
    twoFactor: false
  },
  {
    id: 'usr_01J8SEEDUSER00000000000005',
    email: 'observer@example.ru',
    name: 'Ольга Лебедева',
    role: 'observer' as const,
    twoFactor: false
  }
];

/** Default password of every seeded user. */
export const SEED_PASSWORD = 'password';
/** Accepted TOTP code for users with 2FA. */
export const SEED_TOTP = '000000';

export const PLAN: Schema<'Plan'> = {
  id: 'pro',
  name: 'Pro',
  features: [
    'auto_replies',
    'ai_replies',
    'review_generation',
    'rank_tracker',
    'communication',
    'store_locator',
    'widgets',
    'products',
    'api_access'
  ],
  limits: { locations: 500, users: 50 }
};

export const ROLE_PERMISSIONS: Record<Schema<'Role'>, Schema<'Action'>[]> = {
  owner: [
    'tenant.billing',
    'users.manage',
    'accounts.manage',
    'integrations.manage',
    'locations.read',
    'locations.edit',
    'publications.edit',
    'reviews.read',
    'reviews.reply',
    'reviews.complain',
    'templates.team',
    'templates.private',
    'analytics.read'
  ],
  admin: [
    'users.manage',
    'accounts.manage',
    'integrations.manage',
    'locations.read',
    'locations.edit',
    'publications.edit',
    'reviews.read',
    'reviews.reply',
    'reviews.complain',
    'templates.team',
    'templates.private',
    'analytics.read'
  ],
  reputation_manager: [
    'locations.read',
    'reviews.read',
    'reviews.reply',
    'reviews.complain',
    'templates.team',
    'templates.private',
    'analytics.read'
  ],
  observer: ['locations.read', 'reviews.read', 'analytics.read']
};

export function seedIdentity(db: MockDb, rnd: Random) {
  db.tenant = {
    id: TENANT_ID,
    name: 'Спортэксперт',
    plan: PLAN,
    timezone: 'Europe/Moscow',
    locale: 'ru',
    settings: { negative_threshold: 3, auto_resolve_on_reply: true },
    created_at: isoDaysAgo(400)
  };
  db.tenants = [
    { id: TENANT_ID, name: 'Спортэксперт', role: 'owner' },
    { id: SECOND_TENANT_ID, name: 'Кофе Хаус (демо)', role: 'admin' }
  ];
  db.users = SEED_USERS.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatar_url: null,
    locale: 'ru',
    status: 'active',
    two_factor_enabled: u.twoFactor
  }));
  db.memberships = SEED_USERS.map((u, i) => ({
    user: db.users[i],
    role: u.role,
    access_rule:
      u.role === 'reputation_manager' && i === 3
        ? { mode: 'groups', group_ids: ['grp_CITY0000000000000000000001'] } // the first city group (Москва)
        : { mode: 'all' },
    status: 'active',
    last_login_at: isoDaysAgo(rnd.int(0, 10)),
    invited_at: isoDaysAgo(rnd.int(30, 300))
  }));
  for (const u of SEED_USERS) db.passwords.set(u.id, SEED_PASSWORD);
  db.invitations = [
    {
      id: rnd.id('inv'),
      email: 'newcolleague@example.ru',
      role: 'reputation_manager',
      access_rule: { mode: 'all' },
      expires_at: isoDaysAgo(-5),
      created_at: isoDaysAgo(2),
      accepted_at: null
    }
  ];
}

export function seedPlatforms(db: MockDb, rnd: Random, scenario: Scenario) {
  db.platforms = PLATFORMS.map((p) => ({ ...p, capabilities: structuredClone(p.capabilities) }));
  if (scenario === 'connector_degraded') {
    const p = db.platforms.find((x) => x.id === 'plt_2gis');
    if (p) p.health = 'degraded';
  }
  const connected = [
    'plt_google',
    'plt_yandex',
    'plt_2gis',
    'plt_zoon',
    'plt_flamp',
    'plt_yell',
    'plt_otzovik',
    'plt_vk',
    'plt_apple',
    'plt_navitel',
    'plt_here'
  ];
  db.platformAccounts = connected.map((pid) => {
    const platform = db.platforms.find((p) => p.id === pid)!;
    const authKind: Schema<'PlatformAccountAuthKind'> = [
      'plt_google',
      'plt_yandex',
      'plt_vk',
      'plt_facebook'
    ].includes(pid)
      ? 'oauth'
      : ['plt_2gis', 'plt_navitel', 'plt_here'].includes(pid)
        ? 'partner_key'
        : ['plt_flamp', 'plt_otzovik', 'plt_apple'].includes(pid)
          ? 'none'
          : 'credentials';
    return {
      id: `pac_${pid.replace('plt_', '').toUpperCase().padEnd(26, '0')}`,
      platform_id: pid,
      auth_kind: authKind,
      status: 'ok',
      display_name: `${platform.name} · Спортэксперт`,
      external_account_id: authKind === 'none' ? null : `acc-${rnd.int(10000, 99999)}`,
      listing_count: 0,
      last_checked_at: isoDaysAgo(0),
      created_at: isoDaysAgo(rnd.int(100, 300))
    };
  });
  if (scenario === 'challenge_required') {
    const a = db.platformAccounts.find((x) => x.platform_id === 'plt_yandex');
    if (a) a.status = 'challenge_required';
    const b = db.platformAccounts.find((x) => x.platform_id === 'plt_zoon');
    if (b) b.status = 'reauth_required';
  }
}

export function seedLocations(db: MockDb, rnd: Random, count: number) {
  // groups: 2 brands, regions, cities
  const brandA: Schema<'LocationGroup'> = {
    id: 'grp_BRAND00000000000000000000A',
    name: 'Спортэксперт',
    kind: 'brand',
    parent_id: null,
    rule: { filter: { brand: 'sportexpert' } },
    location_count: 0
  };
  const brandB: Schema<'LocationGroup'> = {
    id: 'grp_BRAND00000000000000000000B',
    name: 'Спортэксперт Outlet',
    kind: 'brand',
    parent_id: null,
    rule: { filter: { brand: 'outlet' } },
    location_count: 0
  };
  db.groups = [brandA, brandB];
  const regionGroups = new Map<string, Schema<'LocationGroup'>>();
  const cityGroups = new Map<string, Schema<'LocationGroup'>>();
  for (const c of CITIES) {
    if (!regionGroups.has(c.region_code)) {
      regionGroups.set(c.region_code, {
        id: `grp_REG${c.region_code.replace('-', '').padEnd(23, '0')}`,
        name: c.region,
        kind: 'region',
        parent_id: null,
        rule: { filter: { region_code: c.region_code } },
        location_count: 0
      });
    }
    cityGroups.set(c.city, {
      id: `grp_CITY${String(cityGroups.size + 1).padStart(22, '0')}`,
      name: c.city,
      kind: 'city',
      parent_id: regionGroups.get(c.region_code)!.id,
      rule: { filter: { city: c.city } },
      location_count: 0
    });
  }
  db.groups.push(...regionGroups.values(), ...cityGroups.values());
  db.groups.push({
    id: 'grp_CUSTOM000000000000000000001',
    name: 'Флагманы',
    kind: 'custom',
    parent_id: null,
    rule: { location_ids: [] },
    location_count: 0
  });

  const totalWeight = CITIES.reduce((s, c) => s + c.weight, 0);
  const plan: typeof CITIES = [];
  for (const c of CITIES) {
    const n = Math.max(1, Math.round((c.weight / totalWeight) * count));
    for (let i = 0; i < n; i++) plan.push(c);
  }
  while (plan.length > count) plan.pop();
  while (plan.length < count) plan.push(CITIES[0]);

  const usedNames = new Map<string, number>();
  db.locations = plan.map((c, i) => {
    const outlet = rnd.chance(0.15);
    const brand = outlet ? brandB : brandA;
    const mall = rnd.pick(MALLS);
    const street = rnd.pick(STREETS);
    const house = String(rnd.int(1, 120));
    const n = (usedNames.get(c.city) ?? 0) + 1;
    usedNames.set(c.city, n);
    const name = `${brand.name}, ${mall ?? `${street}, ${house}`}`;
    const status: Schema<'LocationStatus'> = rnd.weighted([
      ['open', 92],
      ['temporarily_closed', 4],
      ['coming_soon', 2],
      ['permanently_closed', 2]
    ]);
    const id = rnd.id('loc');
    const cityGroup = cityGroups.get(c.city)!;
    const regionGroup = regionGroups.get(c.region_code)!;
    const version = rnd.int(1, 30);
    const loc: Location = {
      id,
      tenant_id: TENANT_ID,
      branch_code: String(100 + i),
      name,
      brand_group_id: brand.id,
      status,
      address: {
        country: 'RU',
        region: c.region,
        city: c.city,
        street,
        house,
        building: rnd.chance(0.2) ? String(rnd.int(1, 4)) : null,
        unit: null,
        postal_code: String(rnd.int(100000, 699999)),
        free_form: `${c.city}, ${street}, ${house}`,
        landmark: mall,
        floor: mall ? String(rnd.int(1, 4)) : null,
        fias_id: null
      },
      geo: {
        lat: c.lat + rnd.float(-0.08, 0.08),
        lng: c.lng + rnd.float(-0.12, 0.12),
        precision: 'rooftop'
      },
      phones: [{ e164: `+7${rnd.int(900, 999)}${rnd.int(1000000, 9999999)}`, kind: 'main' }],
      emails: [`store${100 + i}@example.ru`],
      website: `https://example.ru/stores/${100 + i}`,
      social: rnd.chance(0.6) ? [{ kind: 'vk', url: `https://vk.com/sportexpert_${100 + i}` }] : [],
      hours: {
        regular: [
          { days: ['mon', 'tue', 'wed', 'thu', 'fri'], intervals: [['10:00', '22:00']] },
          { days: ['sat', 'sun'], intervals: [['10:00', '21:00']] }
        ],
        special: rnd.chance(0.3)
          ? [
              { date: '2026-12-31', intervals: [['10:00', '18:00']] },
              { date: '2027-01-01', closed: true }
            ]
          : []
      },
      categories: {
        primary: 'cat_sporting_goods',
        additional: rnd.chance(0.5) ? ['cat_shoes'] : []
      },
      attributes: {
        wheelchair_accessible: rnd.chance(0.7),
        card_payment: true,
        parking: mall !== null
      },
      description: `Магазин спортивных товаров ${brand.name} в городе ${c.city}. Одежда, обувь и инвентарь для спорта и активного отдыха.`,
      media: { logo: null, cover: null, photos: [] },
      platform_overrides: rnd.chance(0.2) ? { plt_2gis: { name: `${brand.name}, магазин` } } : {},
      field_policies: { hours: 'enforce', description: 'accept_platform' },
      timezone: c.tz,
      version,
      group_ids: [brand.id, regionGroup.id, cityGroup.id],
      listing_summary: undefined,
      created_at: isoDaysAgo(rnd.int(60, 400)),
      updated_at: isoDaysAgo(rnd.int(0, 60)),
      deleted_at: null
    };
    brand.location_count++;
    regionGroup.location_count++;
    cityGroup.location_count++;
    if (i < 5) {
      loc.group_ids.push('grp_CUSTOM000000000000000000001');
      const custom = db.groups.find((g) => g.id === 'grp_CUSTOM000000000000000000001')!;
      custom.rule!.location_ids!.push(id);
      custom.location_count++;
    }
    db.locationVersions.set(
      id,
      Array.from({ length: Math.min(version, 6) }, (_, k) => ({
        version: version - k,
        author:
          k === 0
            ? { kind: 'user', user_id: SEED_USERS[1].id, name: SEED_USERS[1].name }
            : rnd.chance(0.3)
              ? { kind: 'platform', platform_id: 'plt_google', name: 'Google' }
              : { kind: 'system', name: 'Импорт XLSX' },
        changed_fields: rnd.sample(
          ['hours', 'phones', 'address', 'description', 'attributes', 'name'],
          rnd.int(1, 3)
        ),
        created_at: isoDaysAgo(k * rnd.int(3, 20) + 1)
      }))
    );
    return loc;
  });
}

const STATUS_WEIGHTS: readonly (readonly [SyncStatus, number])[] = [
  ['synced', 1162],
  ['sent', 98],
  ['action_required', 12],
  ['not_connected', 30],
  ['unsupported', 8],
  ['error', 4]
];
const REASONS: ActionReason[] = [
  'verification_required',
  'access_lost',
  'moderation_rejected',
  'conflicting_owner',
  'drift_needs_decision',
  'duplicate_detected',
  'manual_task_pending',
  'listing_suspended'
];

export function seedListings(db: MockDb, rnd: Random, scenario: Scenario) {
  db.listings = [];
  db.operations = [];
  for (const loc of db.locations) {
    const counts: Schema<'ListingStatusCounts'> = {
      synced: 0,
      sent: 0,
      action_required: 0,
      not_connected: 0,
      unsupported: 0,
      error: 0,
      total: 0
    };
    for (const platform of db.platforms) {
      const account = db.platformAccounts.find((a) => a.platform_id === platform.id);
      let status: SyncStatus = account ? rnd.weighted(STATUS_WEIGHTS) : 'not_connected';
      if (!platform.capabilities.listing?.write && status !== 'not_connected')
        status = rnd.chance(0.8) ? 'synced' : 'unsupported';
      if (
        scenario === 'challenge_required' &&
        platform.id === 'plt_yandex' &&
        status !== 'not_connected'
      )
        status = rnd.chance(0.3) ? 'action_required' : status;
      const reason: ActionReason | undefined =
        status === 'action_required'
          ? scenario === 'challenge_required' && platform.id === 'plt_yandex'
            ? 'challenge_required'
            : rnd.pick(REASONS)
          : undefined;
      const matchState: Schema<'MatchState'> =
        status === 'not_connected'
          ? 'candidate'
          : rnd.weighted([
              ['confirmed', 80],
              ['auto_confirmed', 15],
              ['needs_review', 5]
            ]);
      const listing: Listing = {
        id: rnd.id('lst'),
        location_id: loc.id,
        platform_id: platform.id,
        platform_account_id: account?.id ?? null,
        external_id:
          status === 'not_connected'
            ? null
            : `${platform.id.replace('plt_', '')}-${rnd.int(100000000, 999999999)}`,
        url:
          status === 'not_connected'
            ? null
            : `${platform.website ?? 'https://example.com'}/place/${rnd.int(1000000, 9999999)}`,
        ownership:
          status === 'not_connected'
            ? 'unclaimed'
            : reason === 'conflicting_owner'
              ? 'foreign'
              : 'owned',
        verification:
          status === 'not_connected'
            ? 'unverified'
            : reason === 'verification_required'
              ? 'pending'
              : reason === 'listing_suspended'
                ? 'suspended'
                : 'verified',
        match_state: matchState,
        duplicate_of: null,
        match_score: status === 'not_connected' ? null : rnd.float(0.82, 0.99),
        sync_status: status,
        action_reason: reason,
        action_hint: reason ? ACTION_HINTS[reason] : null,
        observed_name:
          status === 'not_connected'
            ? null
            : (loc.platform_overrides?.[platform.id]?.name ?? loc.name),
        observed_address: status === 'not_connected' ? null : (loc.address.free_form ?? null),
        drift_fields:
          reason === 'drift_needs_decision'
            ? rnd.sample(['hours', 'phones', 'name'], rnd.int(1, 2))
            : [],
        last_snapshot_at: status === 'not_connected' ? null : isoDaysAgo(rnd.int(0, 3)),
        last_seen_at: status === 'not_connected' ? null : isoDaysAgo(rnd.int(0, 1))
      };
      db.listings.push(listing);
      counts[status]++;
      counts.total++;
      if (account) account.listing_count++;
      if (status === 'sent' || status === 'error' || rnd.chance(0.15)) {
        db.operations.push({
          id: rnd.id('op'),
          listing_id: listing.id,
          batch_id: null,
          patch: [
            {
              field: rnd.pick(['hours', 'phones', 'description']),
              from: 'старое значение',
              to: 'новое значение'
            }
          ],
          state:
            status === 'sent'
              ? rnd.pick(['sent', 'pending_moderation'])
              : status === 'error'
                ? 'failed_terminal'
                : 'confirmed',
          attempts: status === 'error' ? 5 : 1,
          error: status === 'error' ? 'PLATFORM_CHANGED: layout drift detected' : null,
          created_at: isoDaysAgo(rnd.int(0, 5)),
          updated_at: isoDaysAgo(rnd.int(0, 1))
        });
      }
    }
    loc.listing_summary = counts;
  }
}

export const ACTION_HINTS: Record<ActionReason, string> = {
  verification_required: 'Подтвердите право собственности на площадке',
  access_lost: 'Переподключите аккаунт площадки',
  challenge_required: 'Площадка запросила подтверждение входа',
  moderation_rejected: 'Исправьте данные и отправьте повторно',
  conflicting_owner: 'Карточкой владеет другой аккаунт',
  listing_suspended: 'Карточка заблокирована площадкой',
  drift_needs_decision: 'Площадка изменила данные — выберите версию',
  duplicate_detected: 'Найден дубль карточки',
  manual_task_pending: 'Ожидает ручной задачи оператора'
};
