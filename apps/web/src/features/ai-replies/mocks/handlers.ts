import type { Schema } from '@lp/contracts';
import {
  http,
  latency,
  newId,
  notFound,
  nowIso,
  requirePermission,
  requireSession,
  validation
} from '@mocks/lib/http';

function compose(
  reviewText: string | null,
  rating: number | null,
  locationName: string,
  authorName: string,
  tone: string,
  signature: string
) {
  const negative = rating !== null && rating <= 3;
  const opener =
    tone === 'formal' ? `Уважаемый(ая) ${authorName}!` : `${authorName}, здравствуйте!`;
  const body = negative
    ? `Нам жаль, что визит в ${locationName} оставил такое впечатление${reviewText ? ` — вы пишете: «${reviewText.slice(0, 60)}…»` : ''}. Мы уже разбираем ситуацию с командой магазина и хотим всё исправить. Напишите нам, пожалуйста, удобный способ связи.`
    : `Спасибо за тёплый отзыв о ${locationName}! Рады, что вам понравилось${reviewText ? ' и что консультанты смогли помочь' : ''}. Ждём вас снова.`;
  return `${opener} ${body}\n\n${signature}`;
}

export const handlers = [
  http.get('/ai-reply-profiles', ({ request, response }) => {
    const { db } = requireSession(request);
    return response(200).json({ items: db.aiProfiles });
  }),
  http.post('/ai-reply-profiles', async ({ request, response }) => {
    const { db } = requirePermission(request, 'templates.team');
    const body = await request.json();
    if (!body.name?.trim()) return validation([{ field: 'name', message: 'Укажите название' }]);
    const p: Schema<'AiReplyProfile'> = {
      id: newId('aip'),
      name: body.name,
      tone: body.tone,
      brand_facts: body.brand_facts ?? '',
      forbidden_phrases: body.forbidden_phrases ?? [],
      signature: body.signature ?? '',
      languages: body.languages ?? ['ru'],
      max_length: body.max_length ?? 700,
      updated_at: nowIso()
    };
    db.aiProfiles.push(p);
    return response(201).json(p);
  }),
  http.get('/ai-reply-profiles/{id}', ({ request, params, response }) => {
    const { db } = requireSession(request);
    const p = db.aiProfiles.find((x) => x.id === params.id);
    return p ? response(200).json(p) : notFound('Profile');
  }),
  http.put('/ai-reply-profiles/{id}', async ({ request, params, response }) => {
    const { db } = requirePermission(request, 'templates.team');
    const p = db.aiProfiles.find((x) => x.id === params.id);
    if (!p) return notFound('Profile');
    Object.assign(p, await request.json(), { updated_at: nowIso() });
    return response(200).json(p);
  }),
  http.delete('/ai-reply-profiles/{id}', ({ request, params, response }) => {
    const { db } = requirePermission(request, 'templates.team');
    const idx = db.aiProfiles.findIndex((x) => x.id === params.id);
    if (idx < 0) return notFound('Profile');
    db.aiProfiles.splice(idx, 1);
    return response(204).empty();
  }),
  http.post('/ai-replies/generate', async ({ request, response }) => {
    await latency(900);
    const { db } = requirePermission(request, 'reviews.reply');
    const body = await request.json();
    const profile = db.aiProfiles.find((p) => p.id === body.profile_id) ?? db.aiProfiles[0];
    const review = body.review_id ? db.reviews.find((r) => r.id === body.review_id) : null;
    if (body.review_id && !review) return notFound('Review');
    const text = review?.text ?? body.sample_review?.text ?? null;
    const rating = review?.rating ?? body.sample_review?.rating ?? null;
    const locationName =
      review?.location_name ?? body.sample_review?.location_name ?? 'наш магазин';
    const author = review?.author.name ?? 'Гость';
    const n = body.variants ?? 1;
    const tones = [profile?.tone ?? 'friendly', 'neutral', 'formal'];
    const variants = Array.from({ length: n }, (_, i) =>
      compose(
        text,
        rating,
        locationName,
        author,
        tones[i % tones.length],
        profile?.signature ?? 'Команда'
      )
    );
    return response(200).json({ variants });
  })
];
