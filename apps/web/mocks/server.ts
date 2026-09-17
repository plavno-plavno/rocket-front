/**
 * Standalone mock core-api (SDD-01 §5.3).
 *
 *   pnpm mock:api            → http://localhost:4010 (MOCK_PORT)
 *
 * - MSW handlers from features (registry) answer known routes.
 * - Any other path that exists in the OpenAPI document answers 501 `not_implemented`
 *   (with the operationId) so missing mocks are visible instead of silent 404s.
 * - `x-mock-scenario` header selects an isolated dataset: seed_default | empty_tenant |
 *   challenge_required | connector_degraded.
 * - `POST /__mock/reset` rebuilds the dataset (used by e2e).
 */
import { createMiddleware } from '@mswjs/http-middleware';
import cors from 'cors';
import express from 'express';
import { loadOpenApiDocument } from '@lp/contracts/openapi';
import { featureHandlers } from '@/generated/mock-registry';
import { dbFor, getDb, isScenario, resetDb, SCENARIOS } from './db';
import { aiReplyStream } from './lib/ai-stream';
import { reviewStream } from './lib/review-stream';
import { serializeSessionCookie, SESSION_HEADER } from './lib/session-cookie';

const PORT = Number(process.env.MOCK_PORT ?? 4010);

const app = express();
app.use(cors({ origin: true, credentials: true }));

app.get('/__mock/health', (_req, res) => res.json({ ok: true, scenarios: SCENARIOS }));
app.post('/__mock/reset', express.json(), (req, res) => {
  const scenario = req.body?.scenario ?? req.header('x-mock-scenario');
  resetDb(isScenario(scenario) ? scenario : undefined);
  res.status(204).end();
});

// Translate the internal session header into a real Set-Cookie (see lib/session-cookie.ts).
app.use((_req, res, next) => {
  const append = res.appendHeader.bind(res);
  res.appendHeader = (name, value) => {
    if (name.toLowerCase() === SESSION_HEADER)
      return append('set-cookie', serializeSessionCookie(String(value)));
    return append(name, value);
  };
  next();
});

// Download stub for finished exports (`Export.download_url`).
app.get('/__mock/exports/:file', (req, res) => {
  res
    .type('text/csv; charset=utf-8')
    .attachment(req.params.file.replace(/\.xlsx$/, '.csv'))
    .send('\uFEFFКод филиала;Название;Город\n100;Спортэксперт, ТРК Жемчужная Плаза;Москва\n');
});

// Fake OAuth provider page: flips the account to `ok` and returns to the app.
app.get('/__mock/oauth/:accountId', (req, res) => {
  for (const db of [
    'seed_default',
    'challenge_required',
    'connector_degraded',
    'empty_tenant'
  ] as const) {
    const account = getDb(db).platformAccounts.find((a) => a.id === req.params.accountId);
    if (account) {
      account.status = 'ok';
      account.last_checked_at = new Date().toISOString();
    }
  }
  res.redirect(
    `${process.env.WEB_URL ?? 'http://localhost:3000'}/dashboard/settings/accounts?oauth=ok`
  );
});

// SSE lives outside MSW (long-lived streaming response).
app.get('/reviews/stream', (req, res) =>
  reviewStream(
    req,
    res,
    dbFor(new Request(`http://localhost${req.url}`, { headers: req.headers as HeadersInit }))
  )
);

// AI generation stream (UI message stream) — JSON requests fall through to MSW.
app.post('/ai-replies/generate', express.json(), (req, res, next) => {
  if (!(req.headers.accept ?? '').includes('text/event-stream')) return next();
  aiReplyStream(
    req,
    res,
    dbFor(new Request(`http://localhost${req.url}`, { headers: req.headers as HeadersInit }))
  );
});

app.use(createMiddleware(...featureHandlers));

// Fallback: known-but-unmocked operations → 501, unknown → 404 (both RFC 9457).
const spec = loadOpenApiDocument();
const routes = Object.entries(spec.paths).map(([path, methods]) => ({
  regex: new RegExp('^' + path.replace(/\{[^}]+\}/g, '[^/]+') + '/?$'),
  methods: Object.fromEntries(
    Object.entries(methods).map(([m, op]) => [
      m.toUpperCase(),
      (op as { operationId?: string }).operationId
    ])
  )
}));

app.use((req, res) => {
  const route = routes.find((r) => r.regex.test(req.path));
  res.type('application/problem+json');
  if (route && route.methods[req.method]) {
    res.status(501).json({
      type: 'https://lp.example/problems/not_implemented',
      title: 'Mock not implemented',
      status: 501,
      code: 'not_implemented',
      detail: `No mock handler for ${req.method} ${req.path} (operationId: ${route.methods[req.method]})`
    });
    return;
  }
  if (route) {
    res.status(405).json({
      type: 'https://lp.example/problems/method_not_allowed',
      title: 'Method not allowed',
      status: 405,
      code: 'method_not_allowed'
    });
    return;
  }
  res.status(404).json({
    type: 'https://lp.example/problems/not_found',
    title: 'Not found',
    status: 404,
    code: 'not_found',
    detail: `${req.method} ${req.path} is not part of the core-api contract`
  });
});

app.listen(PORT, () => {
  console.warn(
    `[mock core-api] listening on http://localhost:${PORT} · ${featureHandlers.length} handlers · scenarios: ${SCENARIOS.join(', ')}`
  );
});
