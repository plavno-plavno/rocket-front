# Deployment

The starter deploys to Vercel out of the box, or anywhere Docker runs. `next.config.ts` sets `output: 'standalone'`, so production builds are optimized for self-hosting.

## Vercel (Recommended)

1. Connect the repository to Vercel
2. Add environment variables in the dashboard
3. Deploy

### Demo without core-api (mock inside Next.js)

When there is no core-api to point `CORE_API_URL` at (e.g. a Vercel preview for stakeholders), set:

| Variable          | Value  |
| ----------------- | ------ |
| `MOCK_API_INLINE` | `true` |
| `MOCK_LATENCY`    | `0` (optional, no simulated latency) |

The mock core-api (`mocks/`) then runs in-process: `src/instrumentation.ts` registers `mocks/inline.ts`, `/api/core/*` is served by `src/app/api/core/[...path]/route.ts` instead of the rewrite, and server-side `core-client` calls the same instance. `CORE_API_URL` is ignored. Seed credentials are the same as locally (`owner@example.ru` / `password`).

Limits: data lives in the memory of a serverless instance — changes are lost on a cold start and are not shared between instances (the session cookie survives both); `/__mock/*` helpers (export downloads, fake OAuth) are not served. Local development is unaffected: without the variable the app proxies to `pnpm mock:api` as before.

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
