import type { Schema } from '@lp/contracts';
import { Random, isoDaysAgo } from '../lib/random';
import { SEED_USERS } from './seed-core';
import {
  AUTHORS,
  QUESTION_TEXTS,
  REPLY_TEXTS,
  REVIEW_NEGATIVE,
  REVIEW_NEUTRAL,
  REVIEW_POSITIVE,
  TAG_NAMES,
  TOPICS
} from './text';
import type { MockDb } from './types';

type Review = Schema<'Review'>;

const REVIEW_PLATFORMS = [
  'plt_google',
  'plt_yandex',
  'plt_2gis',
  'plt_zoon',
  'plt_flamp',
  'plt_yell',
  'plt_otzovik',
  'plt_vk'
];

export function seedTemplatesAndTags(db: MockDb, rnd: Random) {
  db.templateGroups = [
    {
      id: 'tgr_00000000000000000000000001',
      name: 'Благодарность',
      sort_order: 0,
      template_count: 0
    },
    { id: 'tgr_00000000000000000000000002', name: 'Извинения', sort_order: 1, template_count: 0 },
    { id: 'tgr_00000000000000000000000003', name: 'Уточнение', sort_order: 2, template_count: 0 }
  ];
  const specs: [
    string,
    string,
    string | null,
    Schema<'TemplateVisibility'>,
    Schema<'Sentiment'>
  ][] = [
    ['Спасибо за оценку', REPLY_TEXTS[0], 'tgr_00000000000000000000000001', 'team', 'positive'],
    [
      'Благодарим, ждём снова',
      REPLY_TEXTS[1],
      'tgr_00000000000000000000000001',
      'team',
      'positive'
    ],
    [
      'Спасибо (коротко)',
      'Спасибо, {{author_name}}! Рады видеть вас в {{location_name}}.',
      'tgr_00000000000000000000000001',
      'team',
      'positive'
    ],
    ['Извинения + контакт', REPLY_TEXTS[2], 'tgr_00000000000000000000000002', 'team', 'negative'],
    ['Извинения, разберёмся', REPLY_TEXTS[4], 'tgr_00000000000000000000000002', 'team', 'negative'],
    [
      'Уточнить детали',
      'Здравствуйте, {{author_name}}! Подскажите, пожалуйста, в какой день вы посещали {{location_name}}? Хотим разобраться.',
      'tgr_00000000000000000000000003',
      'team',
      'neutral'
    ],
    ['Передадим команде', REPLY_TEXTS[3], 'tgr_00000000000000000000000003', 'team', 'neutral'],
    [
      'Мой вариант благодарности',
      '{{author_name}}, спасибо! Заходите ещё — {{manager_name}}.',
      null,
      'private',
      'positive'
    ],
    [
      'Мой вариант извинения',
      '{{author_name}}, простите за неудобства, напишите мне напрямую — {{manager_name}}.',
      null,
      'private',
      'negative'
    ]
  ];
  db.templates = specs.map(([name, body, group_id, visibility, sentiment_hint], i) => {
    const group = db.templateGroups.find((g) => g.id === group_id);
    if (group) group.template_count++;
    return {
      id: rnd.id('tpl'),
      name,
      body,
      group_id,
      visibility,
      owner_user_id: visibility === 'private' ? SEED_USERS[2].id : SEED_USERS[1].id,
      sort_order: i,
      sentiment_hint,
      usage_count: rnd.int(0, 400),
      updated_at: isoDaysAgo(rnd.int(0, 90))
    };
  });
  db.tags = TAG_NAMES.map(([name, color]) => ({ id: rnd.id('tag'), name, color, review_count: 0 }));
  db.aiProfiles = [
    {
      id: 'aip_00000000000000000000000001',
      name: 'Основной профиль',
      tone: 'friendly',
      brand_facts:
        'Сеть магазинов спортивных товаров Спортэксперт. Возврат в течение 30 дней. Программа лояльности «Спортклуб».',
      forbidden_phrases: ['компенсация', 'скидка 50%', 'гарантируем'],
      signature: 'Команда Спортэксперт',
      languages: ['ru', 'en'],
      max_length: 700,
      updated_at: isoDaysAgo(12)
    }
  ];
  db.autoReplyRules = [
    {
      id: rnd.id('arr'),
      name: 'Спасибо за 5 звёзд без текста',
      enabled: true,
      priority: 0,
      conditions: {
        ratings: [5],
        has_text: false,
        platform_ids: ['plt_google', 'plt_yandex', 'plt_2gis'],
        scope: 'all',
        keywords: []
      },
      action: { template_ids: db.templates.slice(0, 3).map((t) => t.id), ai_profile_id: null },
      mode: 'publish',
      delay_minutes: 30,
      working_hours_only: true,
      stats: { fired_30d: 412 },
      updated_at: isoDaysAgo(20)
    },
    {
      id: rnd.id('arr'),
      name: 'Черновик ИИ для 1–2 звёзд',
      enabled: true,
      priority: 1,
      conditions: { ratings: [1, 2], has_text: true, platform_ids: [], scope: 'all', keywords: [] },
      action: { template_ids: [], ai_profile_id: 'aip_00000000000000000000000001' },
      mode: 'draft',
      delay_minutes: 0,
      working_hours_only: false,
      stats: { fired_30d: 96 },
      updated_at: isoDaysAgo(4)
    },
    {
      id: rnd.id('arr'),
      name: 'Отключено: 4 звезды',
      enabled: false,
      priority: 2,
      conditions: { ratings: [4], has_text: null, platform_ids: [], scope: 'all', keywords: [] },
      action: { template_ids: [db.templates[1].id], ai_profile_id: null },
      mode: 'draft',
      delay_minutes: 60,
      working_hours_only: true,
      stats: { fired_30d: 0 },
      updated_at: isoDaysAgo(70)
    }
  ];
}

export function seedReviews(db: MockDb, rnd: Random, count: number) {
  db.reviews = [];
  db.replies = [];
  db.notes = [];
  db.complaints = [];
  db.activity = [];
  const now = Date.now();
  const candidateListings = db.listings.filter(
    (l) => REVIEW_PLATFORMS.includes(l.platform_id) && l.sync_status !== 'not_connected'
  );
  const managers = [SEED_USERS[2].id, SEED_USERS[3].id, SEED_USERS[1].id];

  for (let i = 0; i < count; i++) {
    const listing = rnd.pick(candidateListings);
    const location = db.locations.find((l) => l.id === listing.location_id)!;
    const rating: Review['rating'] = rnd.weighted([
      [5, 52],
      [4, 18],
      [3, 8],
      [2, 6],
      [1, 12],
      [null, 4]
    ]);
    const hasText = rating === null ? true : rnd.chance(0.7);
    const text = !hasText
      ? null
      : rating === null
        ? rnd.pick(REVIEW_NEUTRAL)
        : rating >= 4
          ? rnd.pick(REVIEW_POSITIVE)
          : rating === 3
            ? rnd.pick(REVIEW_NEUTRAL)
            : rnd.pick(REVIEW_NEGATIVE);
    const ageDays = rnd.float(0, 90) ** 1.3 / 90 ** 0.3; // more recent reviews
    const publishedAt = now - ageDays * 86_400_000;
    const ingestedAt = publishedAt + rnd.int(1, 12) * 60_000;
    const edited = rnd.chance(0.25);
    const deleted = rnd.chance(0.08);
    const answered =
      rating !== null && (rating >= 4 ? rnd.chance(0.6) : rnd.chance(0.5)) && ageDays > 0.02;
    const sentiment: Schema<'Sentiment'> =
      rating === null
        ? 'neutral'
        : rating >= 4
          ? 'positive'
          : rating === 3
            ? 'neutral'
            : 'negative';
    const workflow: Schema<'ReviewWorkflowStatus'> = answered
      ? 'resolved'
      : sentiment === 'negative'
        ? rnd.weighted([
            ['new', 50],
            ['in_progress', 35],
            ['escalated', 15]
          ])
        : rnd.weighted([
            ['new', 70],
            ['in_progress', 10],
            ['no_reply_needed', 20]
          ]);
    const assignee = workflow === 'new' && rnd.chance(0.6) ? null : rnd.pick(managers);
    const tagIds =
      text && rnd.chance(0.45) ? rnd.sample(db.tags, rnd.int(1, 2)).map((t) => t.id) : [];
    for (const t of tagIds) db.tags.find((x) => x.id === t)!.review_count++;
    const complaint = sentiment === 'negative' && rnd.chance(0.19);
    const review: Review = {
      id: rnd.id('rev'),
      listing_id: listing.id,
      location_id: location.id,
      location_name: location.name,
      platform_id: listing.platform_id,
      external_id: `${listing.platform_id.replace('plt_', '')}-rev-${rnd.int(100000, 999999)}`,
      url: listing.url ? `${listing.url}/reviews/${rnd.int(1000, 9999)}` : null,
      author: { name: rnd.pick(AUTHORS), external_id: null, avatar_url: null },
      rating,
      text,
      lang: 'ru',
      published_at: new Date(publishedAt).toISOString(),
      ingested_at: new Date(ingestedAt).toISOString(),
      current_version: edited ? 2 : 1,
      platform_state: deleted ? 'deleted_by_author' : edited ? 'edited' : 'visible',
      workflow_status: workflow,
      assignee_user_id: assignee,
      tag_ids: tagIds,
      sentiment,
      aspects: text ? rnd.sample(TOPICS, rnd.int(1, 2)).map((topic) => ({ topic, sentiment })) : [],
      reply_count: 0,
      note_count: 0,
      has_published_reply: false,
      response_time_s: null,
      complaint_state: complaint
        ? rnd.weighted([
            ['submitted', 60],
            ['accepted', 15],
            ['rejected', 20],
            ['requested', 5]
          ])
        : undefined
    };
    db.reviews.push(review);

    if (edited) {
      db.reviewVersions.set(review.id, [
        {
          version: 1,
          rating: rating === null ? null : Math.max(1, rating - 1),
          text: text ? `${text} (первая версия)` : null,
          observed_at: review.ingested_at
        },
        { version: 2, rating, text, observed_at: isoDaysAgo(Math.max(0, ageDays - 1)) }
      ]);
    }
    db.activity.push({
      id: rnd.id('act'),
      review_id: review.id,
      type: 'ingested',
      actor: { kind: 'platform', name: listing.platform_id },
      payload: {},
      at: review.ingested_at
    });

    if (answered) {
      const responseS = Math.round(
        rnd.weighted([
          [rnd.int(300, 1800), 60],
          [rnd.int(1800, 7200), 25],
          [rnd.int(7200, 86400), 15]
        ])
      );
      const publishedReplyAt = new Date(publishedAt + responseS * 1000).toISOString();
      const origin: Schema<'ReplyOrigin'> = rnd.weighted([
        ['template', 45],
        ['manual', 30],
        ['auto', 15],
        ['ai', 10]
      ]);
      const template =
        sentiment === 'positive'
          ? rnd.pick(db.templates.slice(0, 3))
          : rnd.pick(db.templates.slice(3, 5));
      db.replies.push({
        id: rnd.id('rpl'),
        review_id: review.id,
        author_user_id: origin === 'auto' ? null : (assignee ?? managers[0]),
        author_name:
          origin === 'auto'
            ? 'Автоответ'
            : SEED_USERS.find((u) => u.id === (assignee ?? managers[0]))!.name,
        origin,
        text: template.body
          .replace('{{author_name}}', review.author.name)
          .replace('{{location_name}}', location.name)
          .replace('{{manager_name}}', 'Алина'),
        state: 'published',
        published_at: publishedReplyAt,
        external_id: `rpl-${rnd.int(10000, 99999)}`,
        error: null,
        response_time_s: responseS,
        created_at: publishedReplyAt
      });
      review.reply_count = 1;
      review.has_published_reply = true;
      review.response_time_s = responseS;
      db.activity.push({
        id: rnd.id('act'),
        review_id: review.id,
        type: 'reply_published',
        actor: {
          kind: origin === 'auto' ? 'system' : 'user',
          user_id: assignee,
          name: origin === 'auto' ? 'Автоответ' : undefined
        },
        payload: { origin },
        at: publishedReplyAt
      });
    } else if (sentiment === 'negative' && rnd.chance(0.3)) {
      db.replies.push({
        id: rnd.id('rpl'),
        review_id: review.id,
        author_user_id: null,
        author_name: 'ИИ-черновик',
        origin: 'ai',
        text: `Здравствуйте, ${review.author.name}! Нам очень жаль, что визит в ${location.name} оставил такое впечатление. Расскажите, пожалуйста, подробнее — мы обязательно разберёмся.`,
        state: 'draft',
        published_at: null,
        external_id: null,
        error: null,
        response_time_s: null,
        created_at: review.ingested_at
      });
      review.reply_count = 1;
    }
    if (rnd.chance(0.1)) {
      db.notes.push({
        id: rnd.id('nte'),
        review_id: review.id,
        user_id: managers[0],
        user_name: SEED_USERS[2].name,
        text: 'Связалась с магазином, ждём ответ директора.',
        created_at: isoDaysAgo(Math.max(0, ageDays - 0.5))
      });
      review.note_count = 1;
    }
    if (complaint) {
      db.complaints.push({
        id: rnd.id('cmp'),
        review_id: review.id,
        reason_code: rnd.pick(['spam', 'offensive', 'not_a_customer', 'competitor']),
        text: 'Автор не был клиентом магазина.',
        state: review.complaint_state!,
        submitted_at: isoDaysAgo(Math.max(0, ageDays - 0.2)),
        created_at: isoDaysAgo(Math.max(0, ageDays - 0.2))
      });
    }
  }
  db.reviews = db.reviews.toSorted((a, b) => (a.published_at < b.published_at ? 1 : -1));
}

export function seedQuestionsAndConversations(db: MockDb, rnd: Random) {
  const listings = db.listings.filter(
    (l) =>
      ['plt_google', 'plt_yandex', 'plt_2gis'].includes(l.platform_id) &&
      l.sync_status !== 'not_connected'
  );
  db.questions = Array.from({ length: 60 }, () => {
    const listing = rnd.pick(listings);
    const location = db.locations.find((l) => l.id === listing.location_id)!;
    const answered = rnd.chance(0.55);
    return {
      id: rnd.id('qst'),
      listing_id: listing.id,
      location_id: location.id,
      location_name: location.name,
      platform_id: listing.platform_id,
      url: listing.url,
      author: { name: rnd.pick(AUTHORS), external_id: null, avatar_url: null },
      text: rnd.pick(QUESTION_TEXTS),
      published_at: isoDaysAgo(rnd.float(0, 60)),
      workflow_status: answered ? 'resolved' : 'new',
      assignee_user_id: answered ? SEED_USERS[2].id : null,
      answer_count: answered ? 1 : 0
    } satisfies Schema<'Question'>;
  });
  db.answers = db.questions
    .filter((q) => q.answer_count > 0)
    .map((q) => ({
      id: rnd.id('ans'),
      question_id: q.id,
      author_user_id: SEED_USERS[2].id,
      text: 'Здравствуйте! Да, уточните, пожалуйста, по телефону магазина — подскажем наличие.',
      state: 'published' as const,
      published_at: isoDaysAgo(rnd.float(0, 30)),
      created_at: isoDaysAgo(rnd.float(0, 30))
    }));
  db.conversations = Array.from({ length: 24 }, () => {
    const listing = rnd.pick(
      listings.filter((l) => ['plt_yandex', 'plt_2gis'].includes(l.platform_id))
    );
    const location = db.locations.find((l) => l.id === listing.location_id)!;
    return {
      id: rnd.id('cnv'),
      platform_id: listing.platform_id,
      location_id: location.id,
      location_name: location.name,
      contact_name: rnd.pick(AUTHORS),
      contact_avatar_url: null,
      last_message_preview: rnd.pick(QUESTION_TEXTS),
      last_message_at: isoDaysAgo(rnd.float(0, 14)),
      unread_count: rnd.weighted([
        [0, 60],
        [1, 25],
        [3, 15]
      ]),
      status: rnd.chance(0.8) ? 'open' : 'closed',
      assignee_user_id: rnd.chance(0.5) ? SEED_USERS[2].id : null
    } satisfies Schema<'Conversation'>;
  });
  db.messages = db.conversations.flatMap((c) => {
    const n = rnd.int(1, 5);
    return Array.from({ length: n }, (_, i) => ({
      id: rnd.id('msg'),
      conversation_id: c.id,
      direction: i % 2 === 0 ? ('inbound' as const) : ('outbound' as const),
      author_user_id: i % 2 === 0 ? null : SEED_USERS[2].id,
      text:
        i % 2 === 0
          ? rnd.pick(QUESTION_TEXTS)
          : 'Здравствуйте! Да, конечно. Подскажите, какой размер вас интересует?',
      attachments: [],
      state: 'published' as const,
      sent_at: isoDaysAgo(rnd.float(0, 14))
    }));
  });
}
