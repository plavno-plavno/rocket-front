# Changelog — rocket-front

Every significant implementation step (SDD-01 §2, SDD-01T §3) gets an entry: what was done, how it was verified, deviations from the SDD.

## T0 — Import of the starter (2026-09-16)

**Done**
- `Kiranism/next-shadcn-dashboard-starter` @ `7705dfc` copied to `apps/web` without git history; `apps/web/UPSTREAM.md` (commit, deviations) and `apps/web/LICENSE.starter` (MIT notice kept).
- pnpm 10 workspace at the repo root (`package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.nvmrc` = 22). bun artifacts removed (`bun.lock`, `bunfig.toml`, `Dockerfile.bun`); `overrides` → root `pnpm.overrides`; `bun …` → `pnpm …` in starter docs.
- Husky moved to the workspace root: `pre-commit` = lint-staged (apps/web), `pre-push` = `typecheck` + `lint:strict`.
- `apps/web/Dockerfile` rewritten for the pnpm workspace (build context = repo root).
- GitHub Actions `ci.yml`: install (frozen lockfile) → typecheck → lint:strict → format:check → build.
- `oxlint` pinned to `1.65.0` and `oxfmt` to `0.42.0` — the versions resolved in the starter's own lockfile. Newer oxlint (1.83) ships React-Compiler rules that fail on the unmodified starter (`set-state-in-effect`, `purity`, …). Upgrade is a separate task after T1.

**Verified locally**
- `pnpm typecheck` ✓, `pnpm lint:strict` ✓ (0 warnings), `pnpm format:check` ✓, `pnpm build` ✓ (25 routes, no Clerk keys needed at build time, Sentry disabled via `NEXT_PUBLIC_SENTRY_DISABLED=true`).

**Not done / notes**
- Clerk is still in the bundle (removed in T1).
- `packages/contracts` is created in T3.

## T1 — Starter cleanup (2026-09-16)

**Done** (SDD-01 §2.1)
- `node scripts/cleanup.js clerk kanban examples themes` (kept theme `vercel` as donor for `lp`), then the script and `scripts/cleanup-templates/` were deleted.
- Kept: `chat`, `ai-chat`, `notifications`, dnd-kit (re-added after the kanban cleanup removed it), `hooks/use-stepper.tsx`, multi-step form moved to `src/features/_reference/multi-step-product-form.tsx`.
- Removed by hand: `products` and `users` demo features and pages, `src/app/api/{products,users}`, `src/constants/mock-api*`, `cta-github.tsx`; `/` now redirects to `/dashboard/overview` (cleanup template).
- Fixed leftovers the cleanup script does not cover at this upstream commit: Clerk `auth.protect()` in `app/dashboard/layout.tsx`, `delay()` from mock-api in the overview slots, demo links in breadcrumbs / nav-config / notifications store.
- `env.example.txt` → `.env.example`, `NEXT_PUBLIC_SENTRY_DISABLED="true"` by default.
- `AGENTS.md`: corrected Radix/New York → Base UI/`base-nova`, ESLint/Prettier → oxlint/oxfmt (full "Project rules (LP)" section comes with T5b).

**Verified locally**
- `pnpm typecheck` ✓, `pnpm lint:strict` ✓, `pnpm format:check` ✓, `pnpm build` ✓ (7 routes).
- `next start` smoke: `/` → 200 (redirect), `/dashboard/{overview,chat,ai-chat,notifications}` → 200, unknown → 404.
- `grep -ri clerk src package.json` → nothing.

**Reference for T3**
- The starter's `features/products` (CRUD table with nuqs + React Query) and `features/users` (sheet form) are the reference for `locations` and `users`; they live in git at commit `7304fd7` (`apps/web/src/features/{products,users}`).

## T3a — `@lp/contracts` draft (2026-09-16)

**Done** (SDD-00 §8 as consumed by SDD-01 §5.1; agreed with the user: contracts are authored here until a contracts repo exists)
- `packages/contracts/openapi/core-api.yaml` — OpenAPI 3.1, **140 paths / 200 operations**, all resources of SDD-00 §8: auth, `/me`, tenants, users + invitations, locations (+ versions, bulk, import wizard, export, preview-sync), location-groups, sync-batches, platforms, platform-accounts (+ OAuth), sources overview, listings (+ summary, operations, actions), reviews (+ summary, stream, replies, notes, complaints, activity, versions), reply-templates (+ bulk, reorder, render), template-groups, tags, auto-reply-rules, ai-reply-profiles + generate, questions/answers, conversations, publications, media (+ listing-media), products, review-campaigns (+ funnel, QR export), widgets, analytics/reviews/* (summary, trend, regions, rankings, staff, concordance, export), analytics/presence/* (summary, trend, sync matrix, platform, keywords, export), rank-projects (+ heatmap, trend, competitors), duplicates, notifications (+ settings), integrations (api-keys, webhooks), settings/sources, exports.
- Conventions baked in: prefixed ULIDs, `page`/`page_size` for tables and `cursor`/`limit` for feeds, `filter[field]`, `scope`, RFC 9457 `Problem`, `x-mock-scenario` header for the mock server.
- Paths were generated from a declarative table (one-off script) to keep CRUD shapes uniform; the YAML is the committed source of truth.
- `src/generated/core-api.d.ts` via `openapi-typescript` (committed; `pnpm gen:check` fails CI on drift). `src/index.ts` exposes `Schemas`, `Schema<K>`, `OperationResponse/Query/Body`, `PageResponse`, `CursorResponse`. `src/openapi.ts` loads the YAML at runtime for the mock server.
- `redocly lint` clean (config `redocly.yaml`); `CHANGE_REQUESTS.md`, `CHANGELOG.md`, `README.md`.
- Root: `pnpm contracts:check` added to `pnpm check` and to CI.

**Deviations / decisions**
- Generated types are committed (not gitignored) so PR diffs show contract impact; drift is caught by `gen:check`.
- Review filters are explicit `filter[...]` query params rather than a free-form object, so nuqs parsers map 1:1.
- Hypothesis-marked endpoints: `/reviews` `POST` [H-UI-06], `/sources/overview` [H-UI-09], `/conversations` [H-UI-05], `/ai-replies/generate` streaming [H-UI-10].

**Verified locally**
- `pnpm contracts:check` ✓ (lint valid, 1 warning: `ReviewStreamEvent` unused — documents the SSE payload), `pnpm --filter @lp/contracts typecheck` ✓.
