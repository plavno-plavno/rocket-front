# Deployment

The starter deploys to Vercel out of the box, or anywhere Docker runs. `next.config.ts` sets `output: 'standalone'`, so production builds are optimized for self-hosting.

## Vercel (Recommended)

1. Connect the repository to Vercel
2. Add environment variables in the dashboard
3. Deploy

### Demo without core-api (mock inside Next.js)

When there is no core-api to point `CORE_API_URL` at (e.g. a Vercel preview for stakeholders), the mock core-api (`mocks/`) runs inside Next.js:

| Variable          | Value                                                                                |
| ----------------- | ------------------------------------------------------------------------------------ |
| `MOCK_API_INLINE` | `true` (or `1`) forces the inline mock, `false` (or `0`) forces the proxy; unset = auto |
| `MOCK_LATENCY`    | `0` (optional, no simulated latency)                                                 |

**Auto mode on Vercel** (`MOCK_API_INLINE` unset): the inline mock is used unless `CORE_API_URL` is an absolute `http(s)` URL the deployment can reach — not `localhost`/`127.0.0.1`, not relative, not the deployment's own host. The build log then prints `core-api: CORE_API_URL (…) → mock core-api inside Next.js`. Outside Vercel an unset flag always means the proxy (`CORE_API_URL`, default `http://localhost:4010`).

The decision is made once in `next.config.ts` at build time (rewrites are baked into the build) and passed to the runtime through `env.MOCK_API_INLINE`, so changing the variables needs a redeploy. In inline mode `src/instrumentation.ts` registers `mocks/inline.ts`, `/api/core/*` is served by `src/app/api/core/[...path]/route.ts` instead of the rewrite, and server-side `core-client` and `/api/ai/reply` call the same instance. Seed credentials are the same as locally (`owner@example.ru` / `password`).

Why it matters: a rewrite to an unreachable or same-origin `CORE_API_URL` makes `/api/core/*` return a Next HTML page; sign-in then failed with «Unexpected token '<', "<!DOCTYPE"… is not valid JSON». `core-client` now turns an HTML answer into a 502 `bad_gateway` error and the sign-in form shows «Сервис временно недоступен».

Limits: data lives in the memory of a serverless instance — changes are lost on a cold start and are not shared between instances (the session cookie survives both); `/__mock/*` helpers (export downloads, fake OAuth) are not served. Local development is unaffected: without Vercel the app proxies to `pnpm mock:api` as before.

For other platforms, see the [Next.js deployment docs](https://nextjs.org/docs/app/getting-started/deploying).

## Environment Variables for Production

Ensure these are set in your deployment platform:

- All `NEXT_PUBLIC_*` variables for client-side access
- `SENTRY_*` variables if using error tracking

Sentry source maps are uploaded automatically in CI.

## Docker

One production-ready `Dockerfile` (Node.js + pnpm, built from the repository root) is included. Pass `NEXT_PUBLIC_*` variables as `--build-arg` at build time and runtime secrets via `-e` at run time.

Build the image:

```bash
# from the repository root (client.ui)
docker build -f apps/web/Dockerfile \
  -t lp-web .
```

Run the container:

```bash
docker run -d -p 3000:3000 \
  --restart unless-stopped \
  --name shadcn-dashboard \
  shadcn-dashboard
```
