# Deployment

The starter deploys to Vercel out of the box, or anywhere Docker runs. `next.config.ts` sets `output: 'standalone'`, so production builds are optimized for self-hosting.

## Vercel (Recommended)

1. Connect the repository to Vercel
2. Add environment variables in the dashboard
3. Deploy

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
