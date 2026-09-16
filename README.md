# rocket-front — Local Presence Platform, web UI

Frontend of the Local Presence Platform (SDD-01). Backend services live in separate repositories; this repo talks to `core-api` only and, during development, to a mock `core-api` server.

## Layout

```
apps/web/            Next.js 16 app (based on next-shadcn-dashboard-starter, see apps/web/UPSTREAM.md)
packages/contracts   @lp/contracts — OpenAPI + generated types + MSW baseline (draft of SDD-00 §8)
docs/                CHANGELOG, track docs, requests
```

## Requirements

- Node 22+ (`.nvmrc`), pnpm 10 (`corepack enable`)

## Commands (from the repo root)

```bash
pnpm install
pnpm dev             # next dev for apps/web
pnpm build
pnpm typecheck
pnpm lint:strict
pnpm format:check
pnpm check           # typecheck + lint:strict + format:check
```

## Process

- One commit per SDD-01 step (T0 … T5b) with green `pnpm check` and `pnpm build`; every step is logged in `docs/CHANGELOG.md`.
- UI tracks (SDD-01T) work in branches `ui/<track>/<slug>`.
- Never edit backend repositories from here; missing contract fields go to `packages/contracts/CHANGE_REQUESTS.md`.
