import type { Schema } from '@lp/contracts';
import { Random, isoDaysAgo } from '../lib/random';
import { KEYWORDS } from './text';
import { SEED_USERS } from './seed-core';
import type { MockDb } from './types';

export function seedContent(db: MockDb, rnd: Random) {
  db.mediaAssets = Array.from({ length: 18 }, (_, i) => ({
    id: rnd.id('med'),
    kind: i === 0 ? ('logo' as const) : i === 1 ? ('cover' as const) : ('photo' as const),
    url: `https://picsum.photos/seed/lp-${i}/1200/800`,
    thumbnail_url: `https://picsum.photos/seed/lp-${i}/300/200`,
    width: 1200,
    height: 800,
    size_bytes: rnd.int(120_000, 900_000),
    location_ids: i < 2 ? [] : rnd.sample(db.locations, rnd.int(1, 4)).map((l) => l.id),
    created_at: isoDaysAgo(rnd.int(0, 120))
  }));
  const photoListings = db.listings.filter(
    (l) =>
      ['plt_google', 'plt_yandex', 'plt_2gis'].includes(l.platform_id) &&
      l.sync_status !== 'not_connected'
  );
  db.listingMedia = Array.from({ length: 140 }, (_, i) => {
    const listing = rnd.pick(photoListings);
    const ugc = rnd.chance(0.4);
    return {
      id: rnd.id('lmd'),
      listing_id: listing.id,
      location_id: listing.location_id!,
      platform_id: listing.platform_id,
      media_asset_id: ugc ? null : rnd.pick(db.mediaAssets).id,
      external_id: `ph-${rnd.int(100000, 999999)}`,
      origin: ugc ? ('user_generated' as const) : ('owner' as const),
      state: ugc
        ? rnd.weighted([
            ['published' as const, 80],
            ['flagged' as const, 15],
            ['rejected' as const, 5]
          ])
        : rnd.weighted([
            ['published' as const, 90],
            ['pending' as const, 10]
          ]),
      url: `https://picsum.photos/seed/lm-${i}/1200/800`,
      thumbnail_url: `https://picsum.photos/seed/lm-${i}/300/200`,
      author_name: ugc ? 'Пользователь площадки' : null,
      observed_at: isoDaysAgo(rnd.int(0, 60))
    };
  });
  db.publications = Array.from({ length: 12 }, (_, i) => {
    const platformIds = rnd.sample(
      ['plt_google', 'plt_yandex', 'plt_2gis', 'plt_vk'],
      rnd.int(1, 3)
    );
    const state: Schema<'PublicationState'> =
      i === 0
        ? 'draft'
        : i === 1
          ? 'scheduled'
          : rnd.weighted([
              ['published', 70],
              ['partially_failed', 20],
              ['failed', 10]
            ]);
    const locs = rnd.sample(db.locations, rnd.int(5, 40));
    return {
      id: rnd.id('pub'),
      type: rnd.pick(['news', 'offer', 'event'] as const),
      title: rnd.pick([
        'Скидки на зимнюю коллекцию',
        'Новое поступление кроссовок',
        'Открытие после ремонта',
        'Мастер-класс по бегу',
        'Акция 2+1 на носки'
      ]),
      text: 'Приходите в магазин и узнайте подробности у консультантов. Предложение действует во всех магазинах сети.',
      media_ids: rnd.chance(0.7) ? [rnd.pick(db.mediaAssets).id] : [],
      cta: rnd.chance(0.5)
        ? { kind: 'learn_more' as const, url: 'https://example.ru/promo' }
        : null,
      platform_ids: platformIds,
      scope: 'all',
      location_ids: locs.map((l) => l.id),
      schedule_at: state === 'scheduled' ? isoDaysAgo(-3) : null,
      starts_at: null,
      ends_at: null,
      state,
      results:
        state === 'draft' || state === 'scheduled'
          ? []
          : locs.flatMap((l) =>
              platformIds.map((p) => ({
                listing_id:
                  db.listings.find((x) => x.location_id === l.id && x.platform_id === p)?.id ??
                  'lst_none',
                platform_id: p,
                state:
                  state === 'published'
                    ? ('published' as const)
                    : rnd.weighted([
                        ['published' as const, 70],
                        ['rejected' as const, 20],
                        ['failed' as const, 10]
                      ]),
                external_id: null,
                url: null,
                error: null
              }))
            ),
      created_by: SEED_USERS[1].id,
      created_at: isoDaysAgo(rnd.int(0, 90))
    };
  });
  db.products = Array.from({ length: 40 }, (_, i) => ({
    id: rnd.id('prd'),
    name: `${rnd.pick(['Кроссовки', 'Футболка', 'Куртка', 'Лыжи', 'Велосипед', 'Мяч', 'Гантели', 'Коврик'])} ${rnd.pick(['Pro', 'Lite', 'Sport', 'Trail', 'City'])} ${i + 1}`,
    category: rnd.pick(['Обувь', 'Одежда', 'Инвентарь', 'Зимние виды спорта', 'Велоспорт']),
    description: null,
    price: { amount_minor: rnd.int(990, 89990) * 100, currency: 'RUB' },
    media_id: null,
    image_url: `https://picsum.photos/seed/prd-${i}/400/400`,
    location_scope: 'all',
    location_ids: [],
    sync_state: { synced: rnd.int(60, 107), sent: rnd.int(0, 10), failed: rnd.int(0, 3) },
    updated_at: isoDaysAgo(rnd.int(0, 30))
  }));
}

export function seedEngagement(db: MockDb, rnd: Random) {
  db.campaigns = [
    {
      id: rnd.id('cmg'),
      name: 'QR на кассах',
      channel: 'qr',
      scope: 'all',
      location_ids: [],
      message_template: 'Оцените наш магазин — нам важно ваше мнение!',
      target_platform_ids: ['plt_google', 'plt_yandex', 'plt_2gis'],
      routing: 'platforms_plus_private',
      private_form_enabled: true,
      status: 'active',
      short_link: 'https://lp.link/sx',
      stats: { sent: 0, opened: 3120, clicked: 1240, reviews_attributed: 318 },
      created_at: isoDaysAgo(120)
    },
    {
      id: rnd.id('cmg'),
      name: 'SMS после покупки',
      channel: 'sms',
      scope: 'grp_BRAND00000000000000000000A',
      location_ids: [],
      message_template: 'Спасибо за покупку в {{location_name}}! Оставьте отзыв: {{link}}',
      target_platform_ids: ['plt_yandex', 'plt_2gis'],
      routing: 'all_to_platforms',
      private_form_enabled: false,
      status: 'active',
      short_link: 'https://lp.link/sx-sms',
      stats: { sent: 12400, opened: 5800, clicked: 1900, reviews_attributed: 402 },
      created_at: isoDaysAgo(60)
    },
    {
      id: rnd.id('cmg'),
      name: 'Email-рассылка (пауза)',
      channel: 'email',
      scope: 'all',
      location_ids: [],
      message_template: 'Расскажите о вашем визите',
      target_platform_ids: ['plt_google'],
      routing: 'all_to_platforms',
      private_form_enabled: false,
      status: 'paused',
      short_link: null,
      stats: { sent: 3000, opened: 900, clicked: 210, reviews_attributed: 41 },
      created_at: isoDaysAgo(200)
    }
  ];
  db.widgets = [
    {
      id: rnd.id('wgt'),
      kind: 'reviews',
      name: 'Отзывы на сайте',
      config: { theme: 'light', min_rating: 4, platforms: ['plt_google', 'plt_yandex'], limit: 12 },
      public_key: 'wk_live_7f3a9c2e',
      allowed_domains: ['example.ru', 'www.example.ru'],
      embed_snippet:
        '<script async src="https://widgets.lp.example/v1/reviews.js" data-key="wk_live_7f3a9c2e"></script>',
      created_at: isoDaysAgo(80)
    },
    {
      id: rnd.id('wgt'),
      kind: 'store_locator',
      name: 'Карта магазинов',
      config: { theme: 'light', default_city: 'Москва' },
      public_key: 'wk_live_1b8d4e6a',
      allowed_domains: ['example.ru'],
      embed_snippet:
        '<script async src="https://widgets.lp.example/v1/locator.js" data-key="wk_live_1b8d4e6a"></script>',
      created_at: isoDaysAgo(40)
    }
  ];
  db.rankProjects = [
    {
      id: 'rnk_00000000000000000000000001',
      name: 'Москва — кроссовки',
      platform_ids: ['plt_google', 'plt_yandex'],
      keywords: KEYWORDS.slice(0, 5),
      grid: { size: 5, radius_m: 3000 },
      schedule: 'weekly',
      scope: 'grp_CITY0000000000000000000001',
      location_ids: [],
      status: 'active',
      last_run_at: isoDaysAgo(2),
      created_at: isoDaysAgo(90)
    },
    {
      id: 'rnk_00000000000000000000000002',
      name: 'Санкт-Петербург — спорттовары',
      platform_ids: ['plt_yandex', 'plt_2gis'],
      keywords: KEYWORDS.slice(2, 8),
      grid: { size: 7, radius_m: 5000 },
      schedule: 'weekly',
      scope: 'grp_CITY0000000000000000000002',
      location_ids: [],
      status: 'active',
      last_run_at: isoDaysAgo(3),
      created_at: isoDaysAgo(60)
    }
  ];
  const dupListings = rnd.sample(
    db.listings.filter((l) => l.sync_status !== 'not_connected'),
    26
  );
  db.duplicates = dupListings.map((l, i) => {
    const location = db.locations.find((x) => x.id === l.location_id)!;
    const kind: Schema<'DuplicateKind'> = rnd.weighted([
      ['duplicate', 60],
      ['fake', 25],
      ['conflicting_owner', 15]
    ]);
    return {
      id: rnd.id('dup'),
      kind,
      state:
        i < 18
          ? ('open' as const)
          : rnd.pick(['confirmed', 'dismissed', 'merged', 'reported'] as const),
      platform_id: l.platform_id,
      location_id: location.id,
      location_name: location.name,
      listing: {
        ...l,
        id: rnd.id('lst'),
        ownership: kind === 'fake' ? 'foreign' : 'unclaimed',
        match_state: kind === 'fake' ? 'suspected_fake' : 'duplicate_of',
        duplicate_of: l.id,
        sync_status: 'not_connected',
        action_reason: undefined,
        action_hint: null,
        observed_name: `${location.name.split(',')[0]} (${rnd.pick(['старая карточка', 'копия', 'филиал'])})`,
        observed_address: location.address.free_form ?? null
      },
      score: rnd.float(0.55, 0.97),
      reasons: [
        { feature: 'name_similarity', weight: 0.35, detail: 'Названия совпадают на 92%' },
        { feature: 'distance', weight: 0.3, detail: 'Расстояние 40 м' },
        {
          feature: 'phone',
          weight: kind === 'fake' ? 0.05 : 0.25,
          detail: kind === 'fake' ? 'Телефон не совпадает' : 'Телефон совпадает'
        }
      ],
      comparison: [
        {
          field: 'name',
          ours: location.name,
          theirs: `${location.name.split(',')[0]} (копия)`,
          match: false
        },
        {
          field: 'address',
          ours: location.address.free_form ?? null,
          theirs: location.address.free_form ?? null,
          match: true
        },
        {
          field: 'phone',
          ours: location.phones?.[0]?.e164 ?? null,
          theirs: kind === 'fake' ? '+79990000000' : (location.phones?.[0]?.e164 ?? null),
          match: kind !== 'fake'
        }
      ],
      distance_m: rnd.float(5, 400),
      created_at: isoDaysAgo(rnd.int(0, 40)),
      resolved_at: i < 18 ? null : isoDaysAgo(rnd.int(0, 10))
    };
  });
}

export function seedPlatformStuff(db: MockDb, rnd: Random) {
  db.notifications = [
    {
      id: rnd.id('ntf'),
      type: 'negative_review',
      title: 'Негативный отзыв',
      body: 'Новый отзыв на 1 звезду в Google: «Ждал консультанта 20 минут…»',
      read: false,
      link: '/dashboard/reviews',
      created_at: isoDaysAgo(0.05)
    },
    {
      id: rnd.id('ntf'),
      type: 'action_required',
      title: 'Требуется действие',
      body: 'Яндекс Бизнес: подтвердите право собственности на 3 карточки',
      read: false,
      link: '/dashboard/locations?filter[sync_status]=action_required',
      created_at: isoDaysAgo(0.4)
    },
    {
      id: rnd.id('ntf'),
      type: 'unanswered_review',
      title: 'Отзывы без ответа',
      body: '17 отзывов без ответа дольше 24 часов',
      read: false,
      link: '/dashboard/reviews?filter[has_reply]=false',
      created_at: isoDaysAgo(1)
    },
    {
      id: rnd.id('ntf'),
      type: 'batch_finished',
      title: 'Массовое редактирование завершено',
      body: '107 компаний обновлены, 2 ошибки',
      read: true,
      link: '/dashboard/locations',
      created_at: isoDaysAgo(2)
    },
    {
      id: rnd.id('ntf'),
      type: 'system',
      title: 'Новая функция: Нейросеть',
      body: 'Генерация ответов на отзывы теперь доступна в вашем тарифе',
      read: true,
      link: '/dashboard/reviews/ai',
      created_at: isoDaysAgo(6)
    }
  ];
  db.notificationSettings = {
    rules: [
      {
        type: 'negative_review',
        enabled: true,
        channels: ['email', 'telegram'],
        threshold_hours: null
      },
      { type: 'unanswered_review', enabled: true, channels: ['email'], threshold_hours: 24 },
      {
        type: 'action_required',
        enabled: true,
        channels: ['email', 'web_push'],
        threshold_hours: null
      },
      { type: 'batch_finished', enabled: true, channels: ['web_push'], threshold_hours: null },
      {
        type: 'account_issue',
        enabled: true,
        channels: ['email', 'telegram', 'web_push'],
        threshold_hours: null
      },
      { type: 'system', enabled: false, channels: [], threshold_hours: null }
    ],
    channels: {
      email: { enabled: true, digest: 'daily' },
      telegram: {
        enabled: false,
        linked: false,
        deeplink: 'https://t.me/lp_notify_bot?start=demo'
      },
      web_push: { enabled: true }
    },
    quiet_hours: { from: '22:00', to: '08:00' }
  };
  db.apiKeys = [
    {
      id: rnd.id('key'),
      name: 'BI-выгрузка',
      prefix: 'lp_live_4k9d',
      scopes: ['locations:read', 'reviews:read'],
      last_used_at: isoDaysAgo(0.2),
      created_at: isoDaysAgo(50)
    }
  ];
  db.webhooks = [
    {
      id: rnd.id('whk'),
      url: 'https://hooks.example.ru/lp',
      events: ['review.created', 'reply.published'],
      enabled: true,
      secret_prefix: 'whs_3a',
      last_delivery_at: isoDaysAgo(0.1),
      last_delivery_status: 200,
      created_at: isoDaysAgo(30)
    }
  ];
  for (const w of db.webhooks) {
    db.webhookDeliveries.set(
      w.id,
      Array.from({ length: 12 }, (_, i) => ({
        id: rnd.id('dlv'),
        event: rnd.pick(w.events),
        status: i === 3 ? 500 : 200,
        attempted_at: isoDaysAgo(i * 0.3),
        error: i === 3 ? 'Upstream timeout' : null
      }))
    );
  }
  db.exports = [];
  db.sourceSettings = {
    field_policies: [
      { field: 'hours', policy: 'enforce' },
      { field: 'phones', policy: 'enforce' },
      { field: 'description', policy: 'accept_platform' },
      { field: 'name', policy: 'ask' }
    ],
    platforms: db.platforms.map((p) => ({
      platform_id: p.id,
      enabled: db.platformAccounts.some((a) => a.platform_id === p.id),
      auto_reply_enabled: ['plt_google', 'plt_yandex', 'plt_2gis'].includes(p.id)
    }))
  };
}
