import type { Schema } from '@lp/contracts';

type Platform = Schema<'Platform'>;

const caps = (over: Partial<Schema<'Capabilities'>> = {}): Schema<'Capabilities'> => ({
  listing: { write: true, create: true, moderation: 'async' },
  reviews: { reply: true, delete_reply: true, complain: true, edits_visible: true },
  questions: { answer: true },
  media: { upload: true, delete: true },
  publications: { create: true, types: ['news', 'offer', 'event'] },
  metrics: {
    metrics: [
      'impressions_maps',
      'impressions_search',
      'actions_calls',
      'actions_website',
      'actions_directions'
    ],
    granularity: 'day',
    latency_days: 2
  },
  rank: { supported: true },
  ...over
});

/** Platform registry as the mock core-api reports it (SDD-00 §3.3). Ids are slugs. */
export const PLATFORMS: Platform[] = [
  {
    id: 'plt_google',
    name: 'Google Business Profile',
    kind: 'map',
    countries: ['RU', 'KZ', 'BY'],
    capabilities: caps(),
    health: 'ok',
    icon: 'platformGoogle',
    website: 'https://business.google.com'
  },
  {
    id: 'plt_yandex',
    name: 'Яндекс Бизнес',
    kind: 'map',
    countries: ['RU', 'KZ', 'BY'],
    capabilities: caps({ rank: { supported: true } }),
    health: 'ok',
    icon: 'platformYandex',
    website: 'https://business.yandex.ru'
  },
  {
    id: 'plt_2gis',
    name: '2ГИС',
    kind: 'map',
    countries: ['RU', 'KZ'],
    capabilities: caps({
      metrics: {
        metrics: ['impressions_total', 'actions_calls', 'actions_directions'],
        granularity: 'day',
        latency_days: 1
      }
    }),
    health: 'ok',
    icon: 'platform2gis',
    website: 'https://2gis.ru'
  },
  {
    id: 'plt_zoon',
    name: 'Zoon',
    kind: 'catalog',
    countries: ['RU'],
    capabilities: caps({
      metrics: undefined,
      rank: { supported: false },
      publications: { create: false, types: [] }
    }),
    health: 'ok',
    icon: 'platformGeneric',
    website: 'https://zoon.ru'
  },
  {
    id: 'plt_flamp',
    name: 'Flamp',
    kind: 'review_site',
    countries: ['RU'],
    capabilities: caps({
      listing: { write: false, create: false, moderation: 'none' },
      metrics: undefined,
      rank: { supported: false },
      publications: { create: false, types: [] },
      media: { upload: false, delete: false }
    }),
    health: 'ok',
    icon: 'platformGeneric',
    website: 'https://flamp.ru'
  },
  {
    id: 'plt_yell',
    name: 'Yell',
    kind: 'review_site',
    countries: ['RU'],
    capabilities: caps({
      listing: { write: true, create: false, moderation: 'manual' },
      metrics: undefined,
      rank: { supported: false },
      publications: { create: false, types: [] }
    }),
    health: 'ok',
    icon: 'platformGeneric',
    website: 'https://yell.ru'
  },
  {
    id: 'plt_otzovik',
    name: 'Отзовик',
    kind: 'review_site',
    countries: ['RU'],
    capabilities: caps({
      listing: { write: false, create: false, moderation: 'none' },
      reviews: { reply: true, delete_reply: false, complain: true, edits_visible: false },
      metrics: undefined,
      rank: { supported: false },
      publications: { create: false, types: [] },
      media: { upload: false, delete: false }
    }),
    health: 'ok',
    icon: 'platformGeneric',
    website: 'https://otzovik.com'
  },
  {
    id: 'plt_vk',
    name: 'ВКонтакте',
    kind: 'social',
    countries: ['RU', 'BY', 'KZ'],
    capabilities: caps({
      metrics: undefined,
      rank: { supported: false },
      reviews: { reply: true, delete_reply: true, complain: false, edits_visible: true }
    }),
    health: 'ok',
    icon: 'platformVk',
    website: 'https://vk.com'
  },
  {
    id: 'plt_facebook',
    name: 'Facebook',
    kind: 'social',
    countries: ['KZ', 'BY'],
    capabilities: caps({ rank: { supported: false } }),
    health: 'ok',
    icon: 'platformGeneric',
    website: 'https://facebook.com'
  },
  {
    id: 'plt_apple',
    name: 'Apple Maps',
    kind: 'map',
    countries: ['RU', 'KZ', 'BY'],
    capabilities: caps({
      reviews: { reply: false, delete_reply: false, complain: false, edits_visible: false },
      metrics: undefined,
      rank: { supported: false },
      publications: { create: false, types: [] }
    }),
    health: 'ok',
    icon: 'platformGeneric',
    website: 'https://mapsconnect.apple.com'
  },
  {
    id: 'plt_navitel',
    name: 'Navitel',
    kind: 'navigator',
    countries: ['RU', 'KZ', 'BY'],
    capabilities: caps({
      listing: { write: true, create: true, moderation: 'manual' },
      reviews: { reply: false, delete_reply: false, complain: false, edits_visible: false },
      metrics: undefined,
      rank: { supported: false },
      publications: { create: false, types: [] },
      media: { upload: false, delete: false },
      questions: undefined
    }),
    health: 'ok',
    icon: 'platformGeneric',
    website: 'https://navitel.ru'
  },
  {
    id: 'plt_here',
    name: 'HERE WeGo',
    kind: 'navigator',
    countries: ['RU', 'KZ', 'BY'],
    capabilities: caps({
      listing: { write: true, create: true, moderation: 'async' },
      reviews: { reply: false, delete_reply: false, complain: false, edits_visible: false },
      metrics: undefined,
      rank: { supported: false },
      publications: { create: false, types: [] },
      media: { upload: false, delete: false },
      questions: undefined
    }),
    health: 'ok',
    icon: 'platformGeneric',
    website: 'https://wego.here.com'
  }
];

export const PLATFORM_IDS = PLATFORMS.map((p) => p.id);
