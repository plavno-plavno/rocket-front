import { http, latency, notFound, requireSession } from '@mocks/lib/http';

/**
 * MSW handlers of the exports feature (SDD-01 §5.3). Registered automatically by `pnpm gen`.
 * Endpoints without a handler answer 501 from the mock server, so missing mocks are visible.
 * Provisional handlers (no contract yet) must be listed in mocks/scenarios.ts as `provisional`.
 */
export const handlers = [
  http.get('/exports', async ({ request, response }) => {
    await latency();
    const { db } = requireSession(request);
    return response(200).json({ items: db.exports.slice(0, 50) });
  }),

  http.get('/exports/{id}', async ({ request, params, response }) => {
    await latency();
    const { db } = requireSession(request);
    const exp = db.exports.find((e) => e.id === params.id);
    if (!exp) return notFound('Export');
    return response(200).json(exp);
  })
];
