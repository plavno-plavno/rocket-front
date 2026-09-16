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

## T3b — core-client, mock core-api, session feature (2026-09-16)

**Done** (SDD-01 §5.1, §5.3, part of §2.2)
- `src/lib/api/core-client.ts` — `openapi-fetch` client typed by `@lp/contracts`. Server: `CORE_API_URL` + forwards session cookie and `x-request-id` from `next/headers`; browser: `/api/core` (Next rewrite in `next.config.ts`). Non-2xx → `ApiError` (RFC 9457 `code`, `detail`, `fieldErrors`); 401 in the browser → redirect to `/auth/sign-in?next=`. Starter's `lib/api-client.ts` removed.
- `mocks/server.ts` — standalone mock core-api (express + `@mswjs/http-middleware` + MSW). `pnpm mock:api` on `MOCK_PORT` (4010). Unmocked-but-contracted routes answer **501 `not_implemented` with the operationId**; unknown routes 404. `POST /__mock/reset`, `GET /__mock/health`. `x-mock-scenario` header selects an isolated dataset: `seed_default`, `empty_tenant`, `challenge_required`, `connector_degraded`.
- `mocks/db/*` — deterministic seed (PRNG seed 42): tenant «Спортэксперт», 5 users (roles owner/admin/2×reputation_manager/observer, admin has 2FA), 12 platforms, 11 platform accounts, 46 groups (brand/region/city/custom), **107 locations** across 22 RU cities, **1284 listings** (statuses ≈ SCR-1), **2400 reviews** (22 % edited, 9 % deleted by author, 55 % answered, median response ≈ 26 min — SCR-4), replies/notes/complaints/activity, 9 templates + 3 groups, 8 tags, 3 auto-reply rules, AI profile, 60 questions, 24 conversations, media, 12 publications, 40 products, 3 campaigns, 2 widgets, 2 rank projects, 26 duplicate cases, notifications, API key, webhook, source settings.
- `mocks/lib/http.ts` — typed `http` (`openapi-msw`), `problem()`, `requireSession()`, `requirePermission()`, list helpers (`parseListQuery`, `sortBy`, `paginate`, `cursorPaginate`, `scopeLocationIds`).
- `src/features/session/` — `api/{types,service,queries,mutations}.ts` (`/me`, badges, sign-in, 2FA, sign-out, password reset, invitations, switch tenant, profile) and `mocks/handlers.ts` (14 handlers). Seed credentials: any seeded email + `password`; TOTP `000000`.
- `.env.example` rewritten (`CORE_API_URL`, `MOCK_PORT`, `MOCK_LATENCY`); `tsconfig` alias `@mocks/*`.
- Contract fix found while seeding: `LocationCore` now requires `name/status/address`, `Location` requires `group_ids`, `platform_overrides` values typed as `PlatformOverride` (types regenerated).

**Decision / gotcha**
- MSW keeps a cookie jar and re-attaches mocked `Set-Cookie` values to later requests, which made unauthenticated `/me` succeed after one sign-in. Handlers therefore emit an internal `x-mock-session` header and `mocks/server.ts` converts it into the real `Set-Cookie` (`mocks/lib/session-cookie.ts`).

**Verified locally**
- `pnpm check` ✓ (contracts lint + drift, typecheck, lint:strict 0 warnings, format), `pnpm build` ✓.
- Mock via curl: `/me` without cookie → 401; wrong password → 401 `invalid_credentials`; owner sign-in → `Set-Cookie lp_session`, `/me` → user/tenant/permissions; admin sign-in → `two_factor_required`; sign-out clears cookie; `GET /locations` → 501 with `list_locations`; `/nope` → 404; `empty_tenant` scenario badges all zero.
- Through Next (`next dev` + rewrite): `POST /api/core/auth/sign-in` passes `Set-Cookie` through; `/api/core/me` returns the problem JSON.

## T4 — Theme `lp`, semantic tokens, Cyrillic fonts, i18n (2026-09-16)

**Done** (SDD-01 §3)
- `src/styles/themes/lp.css` — product theme (light + dark) with own palette (deep blue-teal primary, cool neutrals). Semantic tokens `--status-{synced,sent,action,error,neutral}` (+ `-bg`), `--rating-{positive,negative,none,star}`, `--platform-{google,yandex,2gis}` exposed to Tailwind as `color-status-*`, `color-rating-*`, `color-platform-*`. `lp` is the default theme; `vercel` kept as donor/comparison.
- Fonts: Geist → **Inter** + **JetBrains Mono** with `subsets: ['latin', 'cyrillic']` (`font.config.ts`, CSS vars `--font-inter`, `--font-jetbrains-mono`).
- **next-intl** (no URL prefix): `src/lib/i18n/{config,request,actions,global.d.ts}`. Locale from `NEXT_LOCALE` cookie → `Accept-Language` → `ru`; timezone from `lp_tz` cookie (mirrors `tenant.timezone`, default `Europe/Moscow`); shared date/number formats (`short`, `medium`, `long`, `time`, `percent`, `rating`). Server actions `setLocaleAction` / `setTimeZoneAction`. Typed messages via `AppConfig` augmentation.
- Messages live inside features: `src/shell/messages/{ru,en}.json` (namespaces `app`, `common`, `layout`, `nav`, `locales`, `roles`, `status`, `table`) and `src/features/session/messages/{ru,en}.json` (auth screens).
- **Generator** `scripts/gen/` (`pnpm gen`, `pnpm gen --check`): builds `src/generated/messages.ts` (static imports → precise types; validates ru/en key parity and namespace collisions) and `src/generated/mock-registry.ts` (replaces the hand-written `mocks/registry.ts`). Runs in `predev`, `prebuild`, `pretypecheck`, `prelint`; `src/generated/` is gitignored; CI runs `gen:check`.
- Root layout: `NextIntlClientProvider`, `<html lang>` from locale, `generateMetadata` from `app.name` / `app.tagline`. `PageContainer` no-access text and page skeleton label, dashboard skip-link → i18n.

**Verified locally**
- `next dev`: default → `<html lang="ru" data-theme="lp">`, «Перейти к содержимому»; `NEXT_LOCALE=en` cookie → `lang="en"`, "Skip to content"; `Accept-Language: en-US` → `en`; body carries Inter + JetBrains Mono variables.
- `pnpm gen` output as expected; `pnpm check` ✓; `pnpm build` ✓.

**Notes**
- Starter data-table strings (pagination, empty state, view options) are translated in T3c together with the locations table; sidebar / user-nav / kbar strings in T2/T5 when those components are rewritten.
- `next/font/google` downloads fonts at build time (network needed in CI); self-hosting the font files is a follow-up if CI is offline.
