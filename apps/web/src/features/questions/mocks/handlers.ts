import type { Schema } from '@lp/contracts';
import {
  cursorPaginate,
  http,
  inScope,
  latency,
  newId,
  notFound,
  nowIso,
  parseListQuery,
  requirePermission,
  requireSession,
  sortBy,
  validation
} from '@mocks/lib/http';

/**
 * MSW handlers of the questions feature (SDD-01 §5.3, S-QA-01). Registered automatically by `pnpm gen`.
 */
export const handlers = [
  http.get('/questions', async ({ request, response }) => {
    await latency(120);
    const { db } = requireSession(request);
    const q = parseListQuery(request);
    const f = q.filters;
    const items = db.questions.filter((x) => {
      if (!inScope(db, q.scope, x.location_id)) return false;
      if (q.q && !`${x.text} ${x.author.name} ${x.location_name ?? ''}`.toLowerCase().includes(q.q))
        return false;
      if (f.platform_id?.length && !f.platform_id.includes(x.platform_id)) return false;
      if (f.workflow_status?.length && !f.workflow_status.includes(x.workflow_status)) return false;
      if (f.has_answer?.length && String(x.answer_count > 0) !== f.has_answer[0]) return false;
      return true;
    });
    return response(200).json(
      cursorPaginate(sortBy(items, [{ field: 'published_at', desc: true }]), q)
    );
  }),

  http.get('/questions/{id}', async ({ request, params, response }) => {
    await latency();
    const { db } = requireSession(request);
    const x = db.questions.find((q) => q.id === params.id);
    if (!x) return notFound('Question');
    return response(200).json(x);
  }),

  http.patch('/questions/{id}', async ({ request, params, response }) => {
    await latency(200);
    const { db } = requirePermission(request, 'reviews.reply');
    const x = db.questions.find((q) => q.id === params.id);
    if (!x) return notFound('Question');
    const body = await request.json();
    if (body.workflow_status) x.workflow_status = body.workflow_status;
    if ('assignee_user_id' in body) x.assignee_user_id = body.assignee_user_id ?? null;
    return response(200).json(x);
  }),

  http.get('/questions/{id}/answers', async ({ request, params, response }) => {
    await latency();
    const { db } = requireSession(request);
    if (!db.questions.some((q) => q.id === params.id)) return notFound('Question');
    return response(200).json({ items: db.answers.filter((a) => a.question_id === params.id) });
  }),

  http.post('/questions/{id}/answers', async ({ request, params, response }) => {
    await latency(400);
    const { db, user } = requirePermission(request, 'reviews.reply');
    const x = db.questions.find((q) => q.id === params.id);
    if (!x) return notFound('Question');
    const body = await request.json();
    if (!body.text?.trim()) return validation([{ field: 'text', message: 'Введите текст ответа' }]);
    const answer: Schema<'Answer'> = {
      id: newId('ans'),
      question_id: x.id,
      author_user_id: user.id,
      text: body.text,
      state: 'requested',
      published_at: null,
      created_at: nowIso()
    };
    db.answers.push(answer);
    x.answer_count++;
    setTimeout(() => {
      answer.state = 'published';
      answer.published_at = nowIso();
      x.workflow_status = 'resolved';
    }, 2000).unref();
    return response(201).json(answer);
  })
];
