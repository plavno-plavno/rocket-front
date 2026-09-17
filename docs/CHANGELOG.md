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

## T2 — Auth pages, session gate, RBAC navigation, tenant switcher (2026-09-16)

**Done** (SDD-01 §2.2)
- Auth screens on `useAppForm` + Zod (messages via next-intl): `/auth/sign-in` (email, password, remember; 401 → «Неверный email или пароль»; `two_factor_required` → `/auth/2fa`), `/auth/2fa` (OTP field, challenge token kept in `sessionStorage`), `/auth/reset` + `/auth/reset/[token]`, `/auth/invite/[token]` (loads `InvitationPublic`, expired → alert). Shared `AuthCard`, auth layout with product name, `LanguageSwitcher`, theme toggle. Dev-only demo hint on the sign-in form.
- `src/proxy.ts`: `/dashboard/**` without `lp_session` cookie → `/auth/sign-in?next=…`; `/auth/sign-in` with cookie → overview; sets `x-pathname` for server helpers.
- `features/session/server.ts`: `getMeServer()` (per-request `cache`, 401 → redirect), `prefetchMe()` (seeds the query client so `useMe()` hydrates), `requireAccess(check)` for pages.
- `features/session/hooks/use-me.ts`: `useMe()` (suspense), `useCan`, `useHasFeature`, `useAccess`. `lib/permissions.ts`: pure `checkAccess(me, check)`, `can`, `hasFeature`.
- `src/types/index.ts` `PermissionCheck` → `requireTenant`, `permission: Action`, `role: Role | Role[]`, `feature: PlanFeature` (typed from `@lp/contracts`). `hooks/use-nav.ts` filters nav groups/items by the session; groups with no visible items disappear.
- Sidebar: header `TenantSwitcher` (memberships from `Me.tenants`, `POST /me/switch-tenant`, clears the query cache), footer `UserNav` (profile, notifications, language submenu, theme submenu light/dark/system, sign out). Starter `nav-user.tsx`, `nav-main.tsx`, `nav-projects.tsx`, `user-nav.tsx` removed.
- `app/dashboard/layout.tsx`: `prefetchMe()` + `HydrationBoundary` + `SessionProvider` (mirrors `tenant.timezone` into the `lp_tz` cookie).
- `features/session/index.ts` — public API (`useMe`, `TenantSwitcher`, `UserNav`, `LanguageSwitcher`, `SessionProvider`, query options, types). Icon `globe` added to the registry.

**Verified locally** (mock on :4010, `next dev` on :3998, curl with cookie jar)
- `/dashboard/overview` without cookie → 307 `/auth/sign-in?next=%2Fdashboard%2Foverview`; with a bogus cookie → same redirect (401 from `/me`).
- Sign-in through `/api/core/auth/sign-in` → cookie; `/dashboard/overview` → 200 with «Спортэксперт», «Ирина Соколова», «Владелец», «Выйти»; with `NEXT_LOCALE=en` → "Owner", "Sign out".
- `/auth/sign-in` with a session → 307 to overview. All auth routes render 200 (`/auth`, `/auth/2fa`, `/auth/reset`, `/auth/reset/[token]`, `/auth/invite/[token]`).
- `pnpm check` ✓.

**Notes / follow-ups**
- `nav-config.ts` still holds the starter's English demo items; T5 replaces it with the generated feature registry + i18n keys.
- `NextIntlClientProvider` currently ships all messages to the client; per-route namespace slicing is a later optimisation.
- Browser-level e2e (Playwright) of the sign-in form arrives with T5b's e2e-smoke.

## T5 — Shell: feature registry, navigation, ⌘K, ScopeSelector, badges, SSE (2026-09-16)

**Done** (SDD-01 §7, SDD-01T §3.1–3.2)
- `src/shell/feature.ts` — `defineFeature({ id, track, status, nav, kbar, routes, screens })`; `src/config/nav-groups.ts` (work/reviews/analytics/content/tools/settings/help) and `src/config/tracks.ts`.
- Generator: `scripts/gen/feature-registry.mjs` → `src/generated/feature-registry.ts`; `pnpm gen --check` now also runs `scripts/gen/validate.ts` under tsx: unique ids/urls/shortcuts/kbar ids, known groups/tracks, i18n keys present in **both** locales (negative test done: a missing key fails with exit 1).
- `src/shell/nav.ts` `buildNavGroups()` (pure): access filtering via `checkAccess`, `order` sort, dynamic badges from `GET /me/badges`, `planned` features hidden in production / «Скоро» in dev. `useNavGroups()` feeds the sidebar and kbar; `useRouteTitles()` feeds registry-driven breadcrumbs. Starter `nav-config.ts` and `use-nav.ts` consumers removed.
- kbar: nav actions + feature `kbar` actions (`navigate` → router, `dialog` → `lp:kbar-action` DOM event) + localized theme actions; search input, theme toggle, footer hints localized.
- `lib/searchparams.ts` (isomorphic: `scope`, `page`, `page_size`, `sort`, `q`, period parsers, server cache) + `hooks/use-scope.ts` (`useScope`, `useCommonSearchParams`).
- `shell/components/scope-selector.tsx` — «Все компании» popover: group tree by kind (brands / regions / cities / custom) with search, multi-select checkboxes, counts, reset; state in `?scope=` (comma-separated group ids). In the header next to ⌘K, `HelpButton` (knowledge base link, `NEXT_PUBLIC_HELP_URL`).
- `shell/components/realtime-provider.tsx` — `EventSource('/api/core/reviews/stream?scope=')`, debounced invalidation of badges / `['reviews','summary']` / `['notifications']`, `useRealtime()` exposes pending events for the inbox «N новых» banner. Mock: `GET /reviews/stream` implemented in express (`mocks/lib/review-stream.ts`): heartbeat + a synthetic review every 20 s (`MOCK_STREAM_INTERVAL_MS`, `MOCK_STREAM=0` to disable), negative ones also create a notification.
- Locations feature groundwork (T3c part 1): `features/locations/{feature.ts,index.ts,api/*,mocks/handlers.ts,messages/*}` — nav item «Мои компании» (`d l`), kbar actions, full API layer, 28 mock handlers (list with `q`/`sort`/`scope`/`filter[city|group_id|status|sync_status|platform_id|platform_kind]`, CRUD with optimistic-locking 409 and 422 validation, versions + rollback, preview-sync, bulk with simulated batch progress, export, import wizard, groups CRUD, sync-batches, listings list/summary/actions/link).

**Verified locally**
- Overview HTML contains group «Работа», item «Мои компании», scope selector, kbar action «Найти компанию»; observer sees the item (has `locations.read`).
- SSE through `/api/core/reviews/stream` delivers `review.ingested` events; unauthenticated → 401.
- Mock locations: 107 rows paged, filters, scope (brand B → 19), summary counts, navigators kind, 422 on empty name/city, 403 for observer, 409 on stale version, bulk 202 with progress.
- `pnpm check` ✓ (gen --check incl. validator).

## T3c — «Мои компании» through the whole layer (2026-09-17)

**Done** (SDD-01 §2 T3 criterion: one feature end-to-end; S-LOC-01 baseline for track UI-F1)
- `components/lp/`: `StatusStatCard` (icon, value, «из N» + progress, clickable filter, `active`), `SyncStatusBadge` / `SyncStatusDot` (icon + text, semantic tokens), `PlatformIcon` (neutral letter-marks `platformGoogle|Yandex|2gis|Vk|Generic`; brand SVGs come from UI-DS), template `ListPage` (header actions, tabs, KPI row, table).
- Table kit: all strings localized (`table.*`), `DataTable` gets `density='compact'` and `emptyState`, `use-data-table` no longer splits text filter values on non-ASCII (Cyrillic search was broken in the starter).
- `features/locations`: `searchparams.ts` (URL ↔ `GET /locations` query mapping, JSON table sort → `-name`), `LocationListing` (RSC prefetch + `HydrationBoundary` + Suspense skeleton), `LocationTable` (`useSuspenseQuery`, nuqs `shallow`, faceted filters city / group / sync status / platform / status, pinned select+name / actions, compact density, empty states), `columns.tsx` (name link + status badge, address, branch code, city, `ListingStatusStack` with hover-card details, updated at, `CellAction` open/edit/listings/delete with confirm), `LocationKpis` (3 cards from `GET /listings/summary`, click = `syncStatus` filter), `LocationTabs` (`?tab=maps|navigators` → `filter[platform_kind]`), `LocationHeaderActions` (export → toast, import/add links gated by `locations.edit`), bulk bar placeholder. Page `app/dashboard/locations/page.tsx` + `loading.tsx`, `requireAccess({ permission: 'locations.read' })`.
- `features/sources` (registry of platforms/accounts/overview/settings): feature.ts (`planned`), api layer, 13 mock handlers incl. fake OAuth page `/__mock/oauth/:id`; public API `platformsQueryOptions`.
- `AlertModal` localized; icons `eye`, `download`, `mapPin`, `sources`, `circleDashed`, platform marks.

**Verified locally**
- `/dashboard/locations` SSR: title, tabs, KPI labels, info panel, 25 seeded rows; `?city=Сочи&tab=navigators` renders Sochi rows; owner sees add/import links, observer does not (`href` grep).
- Cyrillic `filter[city]` works when percent-encoded (browsers do this; curl needs `-g` + encoding).
- `pnpm check` ✓.

**Follow-ups (UI-F1)**: bulk actions, location form / detail page, import wizard; browser e2e arrives with T5b's Playwright setup.

## T5b-1 — Playwright e2e against the mock (2026-09-17)

**Done** (SDD-01 §12, SDD-01T §3.10 e2e-smoke)
- `apps/web/playwright.config.ts`: projects `setup` (resets mock data), `desktop` (1440×900), `mobile` (390, `*.mobile.spec.ts`); `webServer` starts the mock (`MOCK_PORT`, latency/stream off) and the app — **production build by default** (`next build && next start`), `E2E_DEV=1` for `next dev`, `E2E_SKIP_BUILD=1` in CI after `pnpm build`. Ports from `WEB_PORT`/`MOCK_PORT` (3100/4100 defaults, worktree tracks use their own).
- `e2e/support/fixtures.ts`: `signInAs()` through `/api/core` (handles 2FA), fixtures `user` / `scenario` / `authed`, `openMenu()` helper that retries a click until the popup is visible. Mock now also reads the scenario from an `x-mock-scenario` **cookie** (browsers cannot add headers to navigations).
- `e2e/smoke.spec.ts` (13 tests): auth gate redirect with `next=`, sign-in form → requested page, wrong password error, admin 2FA flow, both routes open, sidebar shows tenant/user/nav, language switch to EN, scope selector filters the list (19 rows for brand B), sign out, observer has no add/import, `empty_tenant` empty state. `features/locations/e2e/list.spec.ts` (4 tests): KPIs/tabs/25 rows + pagination + search, KPI click toggles `syncStatus`, navigators tab changes totals, delete confirmation dialog.
- CI: installs Chromium and runs e2e after the build; report uploaded on failure.

**Bugs found and fixed by the suite**
- Base UI `DropdownMenuLabel` must sit inside `DropdownMenuGroup` — the user menu and tenant switcher crashed on open (`MenuGroupContext is missing`).
- Next dev-tools badge overlapped the sidebar footer button (`devIndicators: false` when `NEXT_DEV_INDICATORS=false`).
- Auth card title was a `div`, now an `h1`.
- Pagination «Всего строк» showed the page size; now uses TanStack `rowCount` (server total).
- Assertions on streamed content are scoped to `#main-content` (React streaming temporarily keeps Suspense HTML in a hidden div → strict-mode duplicates).

**Verified locally**: `pnpm e2e` — 17 passed, 3 consecutive runs (≈5 s each with a warm build); `pnpm check` ✓.

## T5b-2 — Scaffolding for parallel tracks (2026-09-17)

**Done** (SDD-01T §3.3–3.7)
- **`pnpm scaffold:api <feature> --tags a,b [--paths /x]`** — generates `api/{types,service,queries,mutations}.ts` from the OpenAPI operations of the given tags: typed service functions (`openapi-fetch`), query-key factory with feature prefix and `scope`, `queryOptions` for GETs, `mutationOptions` for writes; skips SSE ops; multipart handled. Verified by generating all tags into a scratch feature and type-checking (0 errors).
- **`pnpm scaffold:feature <id> | --all`** driven by `scripts/scaffold/features.json` (single source of truth: track, tags, nav, kbar, routes, screens): `feature.ts`, `index.ts`, `messages/{ru,en}.json` (nav keys pre-filled so `gen --check` passes), `mocks/{handlers,fixtures,scenarios}.ts`, `searchparams.ts`, `components/`, `e2e/`, then `scaffold:api`. Ran for all 28 features.
- **`pnpm scaffold:routes`** — every SDD-01 §6 route now has `page.tsx` (`PlannedPage` with feature / screen / track badges), `loading.tsx`, `error.tsx` (`RouteError` with request id + retry). 44 routes.
- **`pnpm check:templates`** (CI) — every `app/dashboard/**/page.tsx` renders a `components/lp` template, `PageContainer` or `PlannedPage` (slot pages, redirect pages and template-rendering layouts are recognised).
- **Page templates**: `ListPage`, `DetailPage`, `AnalyticsPage`, `InboxPage` (resizable list | detail | filters), `SettingsPage`, `WizardPage` (stepper) + `PlannedPage`.
- **`components/lp` with final props**: `StatusStatCard`, `DistributionCard`, `PeriodPicker` (presets / range / granularity / compare, `presetRange`, `previousPeriod`), `RatingStars`, `PlatformIcon`, `SyncStatusBadge/Dot`, `ReviewVersionDiff` (word diff), `TemplateBodyEditor` (variable chips, unknown-variable check, preview), `SortableTable` (dnd-kit, keyboard), `KwicTable`, `RegionChoropleth` (tile-map stub, same props as the future d3-geo map), `RankHeatmap` (grid stub for MapLibre).
- **Public inter-feature stubs (§3.5), all working against the mock**: `LocationPicker`, `LocationStatusStack`, `ActionRequiredList` (locations); `UserCombobox` (users); `TemplatePicker` (templates); `TagPicker` (tags); `AiReplyButton` (ai-replies, word-by-word "stream" over the JSON variant); `ReviewDrawer`, `RecentReviewsList` (reviews); `ReviewsTrendCard` (review-analytics); `PresenceTrendCard` (presence); `NotificationBell` (notifications, replaces the starter's zustand demo).
- **Mock handlers** (now 127): users + invitations, reply-templates (+ groups, bulk, reorder, render with variable validation), tags, ai-reply-profiles + generate, reviews inbox (all SCR-3 filters, summary, replies with simulated publication, notes, complaints with capability 409, activity, versions, manual review, export), review analytics (summary with compare period, trend by granularity, regions, rankings, staff, concordance), presence (deterministic synthetic metrics, sync matrix, per-platform, keywords), notifications (+ settings).
- **Overview (S-OVR-01)** rebuilt on SDD slots `@kpi`, `@reviews_trend`, `@presence_trend`, `@recent_reviews`, `@action_required` with per-slot loading/error; starter demo slots and graphs removed; `chat` / `ai-chat` demo routes removed, their features moved to `features/_reference/`.
- **Icons**: `components/icons.tsx` → `components/icons/sets/{common,nav,platforms}.ts` merged by `pnpm gen` into the generated `components/icons/index.ts` (import path unchanged; duplicate keys fail generation).
- Deps: `diff`, `@tanstack/react-virtual`, `@playwright/test`. `LinkButton` (Link styled as button — the `render={<Link/>}` form trips a11y lint).

**Verified locally**
- `pnpm check` ✓ (gen --check validates 28 features), `check:templates` ✓, `pnpm build` ✓, `pnpm e2e` 17/17.
- Production smoke with curl: all 44 dashboard routes → 200 for the owner; sidebar in production lists only non-planned features (overview, locations); observer sees no add/import links.
- Gotcha recorded: `rewrites()` bake `CORE_API_URL` at **build** time — `next start` must point at the same mock instance the build used (or rebuild).

**Not in this step**: `tracks.json` / `check:ownership` / dependency-cruiser / worktree scripts / docs per track / AGENTS.md rules — T5b-3.

## T5b-3 — Ownership, boundaries, worktree tooling, track docs, agent rules (2026-09-17)

**Done** (SDD-01T §3.8–3.10, §5–6; SDD-01 §11)
- `apps/web/tracks.json` — globs per track (UI-0, UI-DS, F1…F8) + shared paths (`docs/requests`, `docs/tracks`). `pnpm check:ownership` (CI): on branches `ui/<track>/…` changed files outside the track's globs fail unless the PR has the `cross-track` label (CI passes `CROSS_TRACK=1` from the label). Skipped on non-track branches.
- `.dependency-cruiser.cjs` + `pnpm depcruise` (CI): feature→feature only via `index.ts`, no feature cycles, `components/{ui,lp}` never import features, features never import `app/`, generated registries only from shell/i18n/kbar/icons/mocks, no direct `@tabler/icons-react`, `core-client` only from `api/*`. Negative tests confirmed both the feature-boundary and tabler rules fire.
- `.github/CODEOWNERS` generated from `tracks.json` (team handles are placeholders).
- Worktree tools: `pnpm wt:new <track> [slug]` (sibling worktree `../lp-ui-<track>`, branch `ui/<track>/<slug>`, install, `.env.local` with `WEB_PORT=3100+n`, `MOCK_PORT=4100+n`), `pnpm wt:dev` (mock + next dev on those ports), `pnpm wt:list`, `pnpm wt:prune` (merged branches).
- `docs/tracks/<track>.md` for all 10 tracks: scope, public API, consumers, features/paths, how to start, DoD checklist. `docs/requests/README.md` (request template + SLA). `docs/UX_WRITING.md` (tone, glossary, formats, states, "never colour alone").
- `AGENTS.md` → section «Project rules (LP)» (where things live, data rules, UI rules, parallel-track protocol, commands, seed credentials); `CLAUDE.md` shortened to an ordered reading list; app `README.md` replaced.
- CI: `fetch-depth: 0`, depcruise + ownership steps.

**Verified locally**: `pnpm check` ✓, `depcruise` ✓ (0 violations on 840 modules), `check:ownership` skips on `main`.

## ui-foundation-v1 — Foundation complete (2026-09-17)

**Fixes after the worktree rehearsal**
- Fresh worktrees have no generated registries: `premock:api`, `premock:api:watch`, `pree2e` run `pnpm gen`; `wt:new` runs `pnpm gen` after install.
- `check:ownership` diffs with `--relative` (was blind when run from `apps/web`).
- Smoke e2e now iterates **all 44 registered routes** (from `scripts/scaffold/features.json`) and checks the admin role in addition to owner / observer.

**Rehearsal (SDD-01T §3.10 «два трека одновременно»)**
- `pnpm wt:new UI-DS smoke-test` → sibling worktree, branch `ui/UI-DS/smoke-test`, `.env.local` with web 3102 / mock 4102.
- Worktree `pnpm wt:dev` (3102/4102) and the main checkout (`next dev` 3998 + mock 4010) ran concurrently; sign-in + `/dashboard/overview` → 200 on both.
- On the track branch `check:ownership` flagged foreign files (`src/features/reviews/index.ts` → UI-F2, `package.json` → UI-0) and accepted the track's own `components/lp` change. Worktree and branch removed afterwards.

**Foundation DoD (SDD-01T §3.10)**
- [x] SDD-01 T0–T5 (T0 import, T1 cleanup, T2 auth, T3 data layer + locations, T4 theme/i18n, T5 shell)
- [x] `defineFeature`, generator, `gen --check` with validator
- [x] All routes with `PlannedPage`; all features scaffolded with `status: planned` (locations / overview `wip`, session `ready`)
- [x] Public stubs §3.5 and `components/lp/*` with final props
- [x] Page templates §3.6 and `check:templates`
- [x] Dependencies §3.7 (`next-intl`, `openapi-fetch`, `openapi-typescript`, `@tanstack/react-virtual`, dnd-kit, `@playwright/test`, `dependency-cruiser`, `diff`, `msw`, `@mswjs/http-middleware`; **not added**: `d3-geo`, `topojson-client`, `maplibre-gl` — deferred to UI-DS together with the geodata / tile-provider licence decision (SDD-01 §4.1); `papaparse` / `xlsx` — not needed, XLSX parsing happens in core-api and the UI only uploads the file)
- [x] `tracks.json`, `check:ownership`, dependency-cruiser, CODEOWNERS
- [x] `wt:new` / `wt:dev` / `wt:list` / `wt:prune`; two tracks ran concurrently without port conflicts
- [x] `docs/tracks/<track>.md` for every track
- [x] e2e-smoke: all routes open, navigation filtered by role (owner / admin / observer)

Tag: `ui-foundation-v1`. Tracks of wave 1 (UI-DS, UI-F1, UI-F2, UI-F3, UI-F7) may start.

## UI-DS — Design System (2026-09-17)

**Done** (branch `ui/UI-DS/design-system`, merged to main)
- `/dashboard/dev/components` — showcase of every `components/lp` primitive (14 sections) and shadcn primitives; production hides it unless `NEXT_PUBLIC_SHOW_DEV_PAGES=true` (e2e builds set it).
- **Russian everywhere**: proper RU/EN nav titles for all 28 features, RU is the only default (browser `Accept-Language` no longer switches to EN — English only via the user menu), starter strings localized (sidebar toggle, info panel, pagination, uploader, combobox, date pickers, kbar, toasts, carousel), `useDateFnsLocale()` for calendars and `date-fns` formats.
- `DataTable`: windowing above 200 rows (`@tanstack/react-virtual`, SSR renders the first window), sticky header kept; sidebar keys by URL (duplicate-key warnings gone).
- `PeriodPicker`: two-month range `Calendar` popover (ru locale), labelled select values.
- `TemplateBodyEditor`: `{{` inline autocomplete (↑/↓, Enter/Tab, Esc), a11y listbox.
- `RegionChoropleth`: real map — d3-geo conic projection over `public/geo/ru-regions.topo.json` (85 federal subjects, 193 KB, built by `pnpm geo:build` from Natural Earth 50m admin-1, **public domain**), keyboard-accessible regions, legend, tile fallback while loading.
- `RankHeatmap`: MapLibre GL (dynamic import) when `NEXT_PUBLIC_MAP_STYLE_URL` is set — worker + shared chunk are copied to `/public/vendor` by `pnpm gen` because the bundler cannot resolve MapLibre's sibling worker; sRGB colours (MapLibre cannot parse oklch); grid fallback otherwise.
- Theme: `pnpm check:contrast` (culori, WCAG AA on 24 token pairs, light + dark; in CI) — light status/rating foregrounds darkened to pass 4.5:1 on their backgrounds.
- Stable dnd-kit ids (`useId`) — no hydration mismatch; `useNow` for relative times; overview cards use `CardAction`; sidebar open by default.
- e2e: `e2e/ds.spec.ts` (sections, windowing, choropleth click, autocomplete, ru calendar); visual regression `e2e/visual/visual.spec.ts` with committed baselines (components / locations / overview × light / dark, `VISUAL=1`).

**Verified locally**: `pnpm check` ✓, `depcruise` ✓, `check:contrast` ✓, `pnpm e2e` 24/24 incl. visual, 0 browser console errors on the showcase / overview / locations.

**Open**: brand SVG marks for platforms (trademark decision), 390px inbox baseline (after UI-F2).

## UI-F1 — Locations & Sources (2026-09-17)

**Done** (branch `ui/UI-F1/locations`, merged to main)
- **S-LOC-03 «Карточка компании»** (`/dashboard/locations/[id]`, `/new`): `DetailPage` with tabs Данные / Карточки / История / Отзывы (`?tab=`), aside with listing status counts, group badges, «Открыть на карте». Form on `useAppForm` + Zod (name, branch code, status, brand, timezone, address, geo, phones, emails, website, social, hours per weekday + special hours, categories, attributes, description, platform overrides, field policies). Save = `POST …/preview-sync` dry-run → diff dialog per listing → `PUT` (409 → conflict message). History tab with rollback (`AlertModal`), listings tab with reason-driven actions and reconnect link, reviews tab via `ReviewDrawer` (UI-F2 public API). Dynamic breadcrumb titles (`useBreadcrumbTitle`).
- **S-LOC-02 «Импорт компаний»** (`/dashboard/locations/import`): `WizardPage` — file (FileUploader, CSV/XLSX, template in `public/templates`) → columns (auto-mapping from RU/EN headers, «name» required) → preview (создать / обновить / ошибка per row, changed fields) → apply (SyncBatch progress) → report (created / updated / failed, «Повторить неуспешные», «Импортировать ещё»).
- **S-LOC-01 bulk actions**: bulk edit Sheet (status / website / description → `POST /locations/bulk` → `BatchProgressDialog` polling `/sync-batches/{id}`), assign to a manual group (`PUT /location-groups/{id}` merging `rule.location_ids`), temporarily close / reopen (confirm → batch), export selected (`POST /locations/export` + polling `GET /exports/{id}` → toast with «Скачать»).
- **S-SRC-01 «Источники»** (`/dashboard/sources`): platform cards (synced / total, coverage %, connector health), `?kind=` tabs, accounts table (auth kind, status, listings, last check, «Проверить», «Переподключить» for OAuth, RBAC `accounts.manage`), coverage table by sync status. `sources` feature → `ready`.
- **`LocationPicker`** rebuilt per SDD-01 §4.2: group tree (brand → region → city, collapsible) + server-searched location list, «Выбрать найденные», single/multi; demo section in the DS showcase.
- Shared fixes (documented in `docs/requests/20260917-UI-F1-cross-track-fixes.md`): `SelectField` shows option labels; dialog/sheet close labels in Russian; `Progress` pins `locale` (hydration mismatch of `aria-valuetext` on the showcase); `GET /exports`, `GET /exports/{id}` mocks + download stub; `common.download` / `common.exportReady`.
- Contract gaps → `packages/contracts/CHANGE_REQUESTS.md`: taxonomy endpoint, partial `LocationBulkRequest.patch`, `ImportUploadResponse.row_count`.
- e2e: `features/locations/e2e/{detail,bulk,import}.spec.ts`, `features/sources/e2e/sources.spec.ts` (owner + observer).

**Verified locally**: `pnpm typecheck` ✓, `lint:strict` ✓ (0 warnings), `format:check` ✓, `gen --check` ✓, `check:templates` ✓, `depcruise` ✓, `check:ownership` (cross-track, documented) — e2e results below.

## UI-F2 — Reviews Inbox (2026-09-17)

**Done** (branch `ui/UI-F2/reviews`, merged to main)
- **S-REV-01 «Обработка отзывов»** (`/dashboard/reviews`, `InboxPage`): 5 KPI cards (Positive / Negative / No rating toggle the rating filter), cursor-paginated list (`useInfiniteQuery`, «Загрузить ещё», `keepPreviousData`), detail column (author, stars, sentiment, location link, external link, copy link; «Изменён» → `ReviewVersionDiff`, «Удалён автором», «Скрыт площадкой»; assignee `UserCombobox`, workflow status, `TagPicker`; tabs Ответы / Заметки / История), composer (`TemplatePicker`, `AiReplyButton` stream, `{{var}}` preview, publish ⌘↵ / draft, edit & delete reply with confirm, `requested → published` polling), complaint dialog (platform reasons from `/platforms/{id}/complaint-reasons`), manual review [H-UI-06] (`LocationPicker` single), export with polling, sort menu, hotkeys `j/k/r/t/a` + help popover, filters panel (period calendar, source, rating, status, has reply, assignee, replied by, tags, has text, state, sentiment, locations; pinned ≥ 1536px, Sheet below), «N новых» banner from `useRealtime()`; every filter lives in the URL (`features/reviews/searchparams.ts`).
- **S-QA-01 «Вопросы и ответы»** (`/dashboard/questions`): simplified inbox with answers, status / assignee, filters; mock handlers for `/questions*` added.
- **`ReviewDrawer`** now renders the full `ReviewDetail` (compact) — F1 location card, F4/F5 get the complete flow for free.
- **`InboxPage`** (DS template): phone layout — KPI strip scrolls horizontally, list ↔ detail switch by `?<detailParam>=` with «Назад»; `PageContainer` header wraps on narrow screens and constrains width (`min-w-0`, fixed a 960px overflow at 390px).
- Shared: `complaintReasonsQueryOptions` in the sources public API; `UserCombobox` shows «…» while members load; Playwright desktop project ignores `*.mobile.spec.ts`.
- e2e: `features/reviews/e2e/inbox.spec.ts` (hotkeys, reply → published, status, notes, history, complaint, manual review, observer has no composer), `inbox.mobile.spec.ts` (390px list → detail → back, no horizontal overflow), `features/questions/e2e/questions.spec.ts`; visual baselines `reviews`, `questions` (1440 light/dark) and `inbox-mobile` (390 light/dark).

**Verified locally**: `pnpm typecheck` ✓, `lint:strict` ✓ (0 warnings), `format:check` ✓, `gen --check` ✓, `check:templates` ✓, `depcruise` ✓, `pnpm e2e` (production build) **47/47** incl. visual baselines (reviews, questions × light/dark; inbox 390px × light/dark); 0 browser console errors on the inbox, questions, drawer and phone flows.

## UI-F3 — Reply Tooling (2026-09-17)

**Done** (branch `ui/UI-F3/reply-tooling`, merged to main)
- **S-REV-02 «Шаблоны ответов»**: `SortableTable` with drag-and-drop order (persisted via `/reply-templates/reorder`; disabled while filtered), search, group / type facets, bulk bar (set group, set type, delete), page-size pagination; Sheet editor (name, group, type, sentiment hint, `TemplateBodyEditor` with `{{ autocomplete, live preview on a real review through `/reply-templates/render`, unknown variables warning); «Настроить группы» dialog with a sortable list, inline rename, create / delete.
- **S-REV-03 «Теги»**: CRUD table with a colour palette + custom colour, review counts, confirm on delete.
- **S-REV-04 «Автоответы»**: priority-ordered rules (drag), enable switch, human-readable conditions / action summary, Sheet form (ratings, has text, platforms, scope via `LocationPicker`, keywords → templates rotation or AI profile; draft / publish, delay, working hours only). Mock handlers for `/auto-reply-rules*` added.
- **S-REV-05 «Нейросеть»** [H-UI-10]: profile form (tone, brand facts, forbidden phrases, signature, languages, max length; multiple profiles) + sandbox that streams the reply. Streaming path: `useCompletion` (AI SDK) → `app/api/ai/reply/route.ts` (forwards the session cookie, passes the UI message stream through) → core `/ai-replies/generate` with `Accept: text/event-stream`. The mock emits `text-start / text-delta / text-end / [DONE]` word by word (`mocks/lib/ai-stream.ts`, express route before MSW). **`AiReplyButton`** now uses the same stream (was a JSON stub) — the inbox composer fills word by word with «Остановить».
- e2e: templates (create with preview, groups, bulk select), tags (create / delete), rules (validation, create, toggle), AI (sandbox stream, composer stream, profile save); visual baselines `templates`, `auto-replies`, `ai`.

**Verified locally**: typecheck ✓, lint:strict ✓ (0 warnings), format:check ✓, gen --check ✓, check:templates ✓, depcruise ✓, `pnpm e2e` (production build) **58/58** incl. visual; 0 browser console errors on all four screens and the streaming flows.

## Deploy — Vercel demo on the inline mock (2026-09-17)

**Problem**: on `rocket-front-web.vercel.app` sign-in failed with «Unexpected token '<', "<!DOCTYPE"… is not valid JSON». The first fix (`553a4f2`, mock core-api inside Next.js behind `MOCK_API_INLINE=true`) was deployed, but the Vercel project had no `MOCK_API_INLINE`, so the build kept the `/api/core/:path*` rewrite to `CORE_API_URL` (a value Vercel cannot reach); `/api/core/auth/sign-in` was served by the `/auth/sign-in` page, `/api/core/me` by `/_not-found`.

**Done**
- `next.config.ts` resolves the core-api target once at build time: `MOCK_API_INLINE=true|1` → inline, `false|0` → proxy; unset → proxy, except on Vercel when `CORE_API_URL` is missing, relative, localhost or the deployment's own host → inline (build log warning). The result is inlined as `env.MOCK_API_INLINE`, so instrumentation / core-client always match the rewrites.
- `/api/ai/reply` (UI-F3 streaming) calls the inline mock too; `mocks/inline.ts` serves `/ai-replies/generate` as a web stream.
- `core-client`: a `text/html` answer from `/api/core` becomes `ApiError` 502 `bad_gateway` instead of a JSON `SyntaxError`; the sign-in form shows «Сервис временно недоступен — попробуйте позже» for 5xx / network errors.
- `docs/deployment.md` — auto mode and the failure it prevents.

**Verified locally**: typecheck ✓, lint:strict ✓, format:check ✓, gen --check ✓. Production build with `VERCEL=1 CORE_API_URL=http://localhost:4010` and no `MOCK_API_INLINE`, started without those variables: no rewrite in `routes-manifest.json`, sign-in 200 JSON + `lp_session`, `/me` 200, `/dashboard/overview` SSR 200, `/api/ai/reply` streams, wrong password 401. Proxy mode (`CORE_API_URL` → `pnpm mock:api`, no `VERCEL`): the same checks pass through the rewrite.

## UI-F7 — Admin & Settings (2026-09-17)

**Done** (branch `ui/UI-F7/admin-settings`, merged to main)
- **S-SET-01 «Пользователи»** (`/dashboard/settings/users`): members table (avatar, role, scope badge «Все компании» / «N компаний» / «N групп», status, last sign-in, «Вы», 2FA mark), search + role / status facets, plan limit line; row menu — change role & access, disable / enable, remove (confirm); pending invitations block with resend / revoke. `UserSheet` «Добавить пользователей»: chips email input (comma / space / paste, invalid emails highlighted), role select with hints («Владелец» only for owner), tab «Правила доступа» — all / selected with `LocationPicker` (groups + locations, «Выбрано: N»), invite notice; same sheet edits an existing member.
- **`UserCombobox`** (public) upgraded from a plain select to a searchable Popover + Command combobox (avatar, name, email, «Не назначен»), disabled members hidden.
- **S-SET-02 «Профиль»**: profile card (name, read-only email, interface language — applied immediately via the locale cookie), password card (current / new / confirm, 422 → message), 2FA status card, organisation card for owner / admin (name, timezone, default language, plan and limits).
- **S-SET-03 «Аккаунты площадок»**: accounts table with platform mark, auth kind, status badge, listings, last check; «Подключить площадку» dialog (platform, OAuth / partner key / login+password with credential fields, OAuth → redirect to the provider, `?oauth=ok|error` handled on return), «Переподключить» (OAuth), «Инструкция» (challenge), «Проверить», disconnect with confirm; alert when accounts need attention. `ConnectAccountDialog` exported for onboarding.
- **S-SET-04 «Уведомления»**: rules × channels matrix (switch per event, checkbox per channel gated by channel state, threshold hours for unanswered reviews), channel cards (email digest, Telegram link / deeplink, web push), quiet hours; dirty-state save / reset with one `PUT /notifications/settings`.
- **S-SET-05 «Интеграции»**: API keys (create dialog with scopes → secret shown once with copy, prefix, last used, revoke with confirm), webhooks (create / edit dialog: https-only URL, events, enabled; enable switch inline; «Тест» → toast with status; delivery log sheet; delete with confirm). Mock handlers for `/integrations/*` added (settings feature).
- **S-SET-06 «Настройка источников»**: field policies table (8 fields × enforce / accept_platform / ask with hints), platforms table (enabled, auto-replies — only when the connector can reply; connector health shown), dirty-state save / reset.
- **S-NOT-01 «Уведомления»**: cursor feed (`useInfiniteQuery`, «Загрузить ещё»), tabs all / unread, type icon + label per item, relative time (< 7 days) or date, open / mark read, «Прочитать все» (disabled when nothing unread), link to channel settings. Bell and page now invalidate both the feed and the header badge (the bell previously refreshed only the badge).
- **S-ONB-01 «Первые шаги»** (`/dashboard/onboarding`, `WizardPage`): companies (count, import / manual links) → platforms (per-platform connection state, connect dialog) → team (count, invite sheet); step in `?step=`, «Пропустить», «Перейти в обзор», RBAC hints for steps the user cannot do.
- `SettingsNav` (public) — nested settings navigation for the `SettingsPage` `nav` slot, RBAC-filtered; `SettingsPage` got `wide` for table screens. Icon set `components/icons/sets/admin.ts`.
- Contract gaps → `packages/contracts/CHANGE_REQUESTS.md`: 2FA enrol / disable, `GET /notifications` `filter[type]`, change own email.
- e2e: `features/users/e2e/users.spec.ts` (invite validation → invitation row, role change from the row menu, observer has no access), `features/settings/e2e/settings.spec.ts` (profile + wrong password, connect partner-key account + check, notification rule save + reload, API key secret + webhook test + deliveries, field policy save + reload), `features/notifications/e2e/notifications.spec.ts` (unread tab, mark all, bell → page), `features/onboarding/e2e/onboarding.spec.ts` (three steps, dialogs, finish); visual baselines `settings-users`, `settings-accounts`, `settings-integrations`, `notifications`, `onboarding` (1440 light / dark).

**Verified locally**: `pnpm gen --check` ✓, `typecheck` ✓, `lint:strict` ✓ (0 warnings), `format:check` ✓, `check:templates` ✓, `depcruise` ✓, `check:ownership` (cross-track additive, documented), `pnpm e2e` (production build) **79/79** incl. visual; 0 browser console errors / 5xx on all eight screens (owner).

## UI-F4 — Analytics (2026-09-17)

**Done** (branch `ui/UI-F4/analytics`, merged to main)
- **Shared analytics infra** (`features/review-analytics`): `useAnalyticsParams()` — period (30 days by default, presets, explicit range, granularity, compare) and inline filters (region / brand / city from location groups, platform) in the URL; `AnalyticsScreen` shell (`AnalyticsPage` + `AnalyticsActions` with `PeriodPicker` and async «Скачать отчёт» polling `/exports/{id}` + `AnalyticsFilters`); `formatDuration` («2 ч 08 мин»), `deltaOf` (KPI deltas with tone; inverted for «bad» KPIs), `waitForExport` — exported publicly.
- **S-ANL-01 «Анализ отзывов»**: six KPI `StatusStatCard`s (total, complaints, edited, answered with progress + share, avg response time, deleted) with deltas when comparing; `RegionChoropleth` card with country select, top-8 regions list, click on a region / list row applies `filter[region]`; `ReviewsTrendCard` (public, now with `granularity` / `filters`), average rating area chart, `DistributionCard` of ratings 1–5 + no rating, «Компании с наибольшим негативом» (top 5 by negative reviews, links to the location card).
- **S-ANL-02…05, 07 rankings** (locations / cities / tags / phrases / topics): one `RankingTable` — search, sortable metric columns (server-side sort added to the mock), share bar, `RatingStars`, answered share, sentiment badge, pagination; locations link to the card, phrases / topics link to the concordance.
- **S-ANL-06 «Сотрудники»**: replies with share bar, average response time, resolved / open per member.
- **S-ANL-08 «Concordance»**: keyword in `?keyword=`, `KwicTable` with rating / platform / location / date meta, row click opens `ReviewDrawer` (F2).
- **S-PRS-01 «Онлайн-присутствие»**: `usePresenceParams()` (period + platform filter + keywords month), KPI impressions / actions (with calls · website · directions hint) / conversion, `PresenceTrendCard` (public, now with `granularity` / `platformIds`), impressions line chart (maps / search), «Не все площадки предоставляют статистику» alert listing `platforms_without_data`, per-platform link cards; **`sync`** — platform × status matrix with `SyncStatusDot`s, totals row and coverage bars; **`platform/[platformId]`** — the same KPI + charts for one platform or an explicit «не предоставляет статистику» empty state (breadcrumb shows the platform name); **`keywords`** — monthly keyword impressions with month select, platform filter, search, trend vs previous month, pagination.
- **S-RNK-01 «Трекер позиций»**: project select + `RankProjectDialog` (name, platforms with `capabilities.rank.supported`, keyword chips, grid 3–9, radius, schedule, scope via `LocationPicker`), run / edit / delete; location × keyword × platform selects in the URL; ARP / SoLV / capture date cards; `RankHeatmap` (DS); ARP (reversed axis) + SoLV trend over the quarter; competitors table. Mock handlers for `/rank-projects*` added (deterministic heatmap around the location centre, trend by schedule, competitors).
- e2e: `features/review-analytics/e2e/analytics.spec.ts` (panel presets / region filter / compare, ranking sort + search, phrases → concordance → review drawer, staff), `features/presence/e2e/presence.spec.ts` (overview, platform filter, platform page without data, sync matrix, keywords month), `features/rank/e2e/rank.spec.ts` (heatmap, keyword switch, run, create project with validation); visual baselines `analytics`, `analytics-locations`, `presence`, `presence-sync`, `rank` (1440 light / dark).

**Verified locally**: `pnpm gen --check` ✓, `typecheck` ✓, `lint:strict` ✓ (0 warnings), `format:check` ✓, `check:templates` ✓, `depcruise` ✓, `pnpm e2e` (production build) **96/96** incl. visual; 0 browser console errors / 5xx on all 13 screens (owner).

## UI-F5 — Content (2026-09-17)

**Done** (branch `ui/UI-F5/content`, merged to main)
- **S-PUB-01 «Публикации»**: state tabs + type filter + search; table with type badge, platform marks, scope count, state badge (spinner while `publishing`, auto-refetch), per-listing result summary (✓ / ✗ / …); `PublicationComposer` Sheet — type toggle, title, text with counter, media picker from the library (first = cover), CTA kind + URL, platforms filtered by `capabilities.publications` (types), scope via `LocationPicker`, `datetime-local` schedule, live preview card; detail Sheet with per-listing results table (polls while publishing), «Повторить неуспешные», edit for draft / scheduled, delete. Mock handlers fan a publication out to listings × platforms and finish it in ~2 s.
- **S-MED-01 «Менеджер фото»**: «Библиотека» (own assets grid, kind / location filters, multi-file upload dialog with `FileUploader` → multipart `POST /media`, delete) and «На площадках» (listing photos grid: platform / origin / state / location filters, own vs UGC badge, state, author, «Пожаловаться» dialog with reason for UGC, request removal). Location filter uses `LocationPicker` single with a custom trigger.
- **S-PRD-01 «Товары и цены»**: catalogue table (image, name, category, formatted price, scope, synced / sent / failed counts), search, category facet, sortable name / price, Sheet editor (name, category, price in ₽, description, photo from the library, scope), delete with confirm, «Отправить на площадки» (`POST /products/sync` → batch toast).
- **S-DUP-01 «Дубли и фейки»**: KPI cards (open / duplicates / fakes / foreign owner) acting as kind filters, tabs open / resolved / all, search, kind + platform facets, queue table with score bars; case Sheet — schematic two-point map with distance, score with weighted reasons, field comparison table (match / mismatch icons), our location vs found listing cards, note, kind-specific actions (merge / confirm / report fake / claim / dismiss).
- Mock handlers for `/publications*`, `/media*`, `/products*`, `/duplicates*` added; `@/features/media` public API.
- Contract gaps → `packages/contracts/CHANGE_REQUESTS.md`: publication drafts, `SyncBatch.kind: products`, documented multipart fields of `POST /media`.
- e2e: `duplicates.spec.ts` (KPI filter, sheet with map / comparison, dismiss, resolved tab), `publications.spec.ts` (validation, preview, create → results, state filter), `media.spec.ts` (upload, UGC filter, report), `products.spec.ts` (validation, create, category filter, sync); visual baselines `publications`, `products`, `duplicates`.

**Verified locally**: `pnpm gen --check` ✓, `typecheck` ✓, `lint:strict` ✓ (0 warnings), `format:check` ✓, `check:templates` ✓, `depcruise` ✓, `pnpm e2e` (production build) **108/108** incl. visual; 0 browser console errors / 5xx on the four screens (owner).

## UI-F8 — Overview (2026-09-17)

**Done** (branch `ui/UI-F8/overview`, merged to main)
- **Period**: `useOverviewPeriod()` — `PeriodPicker` (presets, range, granularity) in the header, `from` / `to` / `granularity` in the URL; both trend widgets (`ReviewsTrendCard`, `PresenceTrendCard`) follow it; page description no longer hard-codes «30 дней».
- **Empty state**: `WelcomeWidget` for a tenant without locations — three first steps (companies / platforms / team) with links and «Первые шаги» → onboarding wizard; hidden as soon as one location exists. Recent reviews and action-required widgets keep their own empty states (F2 / F1).
- Header actions use `LinkButton` (rule 10); widgets carry `data-testid`s for e2e; slot order per SDD-01 §8 unchanged (KPI → trends → recent reviews | action required).
- e2e: `features/overview/e2e/overview.spec.ts` (KPI + widgets, week preset → URL + «по дням», KPI click → reviews inbox; `empty_tenant` → welcome card → onboarding). Visual baseline `overview` already existed (UI-DS).

**Verified locally**: `pnpm gen --check` ✓, `typecheck` ✓, `lint:strict` ✓, `format:check` ✓, `check:templates` ✓, `depcruise` ✓, `pnpm e2e` (production build) **110/110** incl. visual (overview baseline refreshed with the period picker).

## UI-F6 — Engagement (2026-09-17)

**Done** (branch `ui/UI-F6/engagement`, merged to main)
- **S-GEN-01 «Кампании»**: table by channel (QR / SMS / WhatsApp / email / link) with platform marks, routing, sent / opened / clicked / reviews, short link copy, status switch (active ↔ paused); `CampaignSheet` — name, channel, status, message template with `{{location_name}}` / `{{link}}`, target platforms, routing radio (all to platforms / platforms + private form) with an explicit «review gating is forbidden» note (SDD-00 §3.10), private-form switch, scope via `LocationPicker`; «Отправить» dialog (location + recipients per line → `POST /review-campaigns/{id}/send` → batch toast); delete with confirm.
- **S-GEN-01 «QR-коды»**: QR campaign select, layout radio (A4 poster / table tent / sticker) with a live layout preview, scope via `LocationPicker`, async PDF export with a download toast (`waitForExport` from F4).
- **S-GEN-01 «Аналитика»**: campaign select + `PeriodPicker` in the URL, KPI cards with step conversion, horizontal funnel bar chart, daily line chart (opened / clicked / reviews); QR campaigns hide «Отправлено».
- **S-WID-01 «Виджет с отзывами»** and **«Сторлокатор» (Beta)**: shared `WidgetConfigurator` (public) — widget select / create, settings (theme; reviews: min rating, limit, platforms; locator: default city, show hours), allowed domains chips, embed snippet with copy, public key rotation with confirm, delete; preview column (reviews: `RecentReviewsList` from F2; locator: search box + map placeholder + first locations); dark theme previews via the `dark` class.
- **S-COM-01 «Коммуникация»** [H-UI-05] on `InboxPage`: cursor thread list (search, unread badges, platform marks, «Загрузить ещё»), detail with contact / platform / location header, assignee `UserCombobox` (F7), close / reopen, message bubbles (inbound / outbound, time, failed state, 15 s refetch), composer (⌘↵), filters panel (status, platforms with `capabilities.questions.answer`) pinned ≥ 1536px and as a Sheet below.
- Mock handlers for `/review-campaigns*` (deterministic funnel), `/widgets*` (key rotation regenerates the snippet), `/conversations*` added.
- Contract gaps → `packages/contracts/CHANGE_REQUESTS.md`: `SyncBatch.kind: campaign_send`, typed widget config.
- e2e: `review-generation.spec.ts` (validation, create, pause, send; QR sticker preview + PDF; analytics campaign switch), `widgets.spec.ts` (save, rotate key, create with domains; locator preview), `communication.spec.ts` (open thread, send, close / reopen, status filter via the Sheet); visual baselines `campaigns`, `widgets`, `communication`.

**Verified locally**: `pnpm gen --check` ✓, `typecheck` ✓, `lint:strict` ✓ (0 warnings), `format:check` ✓, `check:templates` ✓, `depcruise` ✓, `pnpm e2e` (production build) **115/115** incl. visual; 0 browser console errors / 5xx on the six screens (owner).

---

**All 28 features are `ready`** (waves 1–3 complete): Foundation, UI-DS, F1, F2, F3, F7, F4, F5, F8, F6. Remaining product work lives in `packages/contracts/CHANGE_REQUESTS.md` (contract gaps) and `docs/requests/` (cross-track notes).

## i18n — Беларуская мова (2026-09-17)

- Third interface locale `be` (Belarusian, official orthography): `LOCALES = ['ru', 'be', 'en']`, `date-fns/locale/be` for calendars, ICU plural rules `one / few / other` as in Russian; `pnpm gen --check` now validates key parity across all three locales.
- 2 163 interface strings translated by hand in `src/shell/messages/be.json` and every `features/*/messages/be.json`; placeholders and ICU plural forms verified against RU; mock data (companies, reviews, names) intentionally stays Russian.
- Language is offered in the user menu, on the auth pages and in the profile («Мова інтэрфейсу»); Russian remains the default, no browser negotiation.
- e2e: `features/session/e2e/locale.spec.ts` — switch to Belarusian in the profile → sidebar and headings in Belarusian while mock content stays Russian → switch back.

## UI-DS — Dashboard refresh and responsive pass (2026-09-17)

**Done** (cross-track, see `apps/web/docs/requests/2026-09-17-UI-DS-dashboard-design.md`)
- Visual refresh: `src/styles/dashboard.css` (shared 4/8px rhythm, 40/44px controls, page heading, cards), pastel KPI tones in `themes/lp.css`, sidebar branding, overview «pulse» (welcome + network health), GSAP panel motion (`dashboard-motion.tsx`, `use-panel-motion.ts`) that respects reduced motion.
- Controls never break mid-word: `overflow-wrap: anywhere` removed everywhere (it shrank buttons in shrink-to-fit table columns to one letter per line — «Проверить» in Sources, «Отозвать» in Integrations; «Команд|ный» in selects). Tabs stay on one row and scroll; toggle groups wrap between items.
- Tables: buttons/badges in cells never wrap; a table that scrolls sideways fades at the edge with hidden columns (scroll-driven, no JS); `DataTable` no longer collapses to 0px on phones (locations list was empty at 375px).
- Tabs: shared `TabsList` renders a Base UI `Tabs.Indicator` — the active segment slides (300ms ease-out, off under reduced motion).
- Overlays: `SheetContent`/`DialogContent` base widths no longer beat the widths features pass (every sheet was 384px, dialogs ignored `max-w-*`); sheets default to `sm:max-w-md`, dialogs to `sm:max-w-lg`, rule editor `2xl`. Dialog footer bleeds to the edges with the dialog padding; card sections inside a `<form>` get the card gap.
- Page header: actions sit under the title on the left on every page; overview toolbar = «Импорт / Добавить компанию» left, period right. «Последние отзывы» / «Требуется действие» share one row rhythm (container query, redundant status badge removed).
- Sidebar: collapsed rail fixed (paddings of the expanded state no longer push icons, brand and avatars off-centre); counters are soft pills, «Новое» / «Бета» filled pills (RU strings were English).
- KPI tiles: brighter dark tones and two slowly drifting glows per tone (`transform` only, per-tile period 22–31s). `color-mix` switched to `oklab` — in `oklch` the near-grey mixes lost their hue and inputs turned brown in the dark theme.
- «Нейросеть» uses the wide settings template; settings nav items no longer overlap on phones; media upload dialog companies row wraps.

**Verified locally**: `gen --check` ✓, `typecheck` ✓, `lint:strict` ✓, `check:contrast` ✓ (WCAG AA), `check:templates` ✓, `depcruise` ✓; layout audit (Playwright, all 53 routes × 375/768/1024/1440 + 1920 dark, 31 overlay states): no page-level horizontal overflow, no letter-per-line controls, no overlapping text in the shell. e2e result is in the commit notes below.

## Help centre + Belarusian Intl polyfill (2026-09-17)

- **`/dashboard/help`** — the last `PlannedPage` replaced by a knowledge base (UI-0): six sections × 22 articles (getting started, locations & listings, reviews, analytics, growth, settings) with full-text search in the URL (`?q=`), an article Sheet (`?article=`) linking to the screen it explains, keyboard shortcuts card, support card (email with the tenant / user ids prefilled). Articles are hand-written in RU / BE / EN in `features/help/messages`; `help` feature → `ready`.
- **Belarusian number / date formatting**: Chromium ships no ICU data for `be` in `Intl.NumberFormat` / `DateTimeFormat`, so the client silently formatted «239,540» and «Sep 1, 2026» while the server rendered Belarusian. New gen step `scripts/gen/intl-polyfill.mjs` builds `/public/vendor/intl/*` from the FormatJS IIFE polyfills (`@formatjs/intl-numberformat@8`, `intl-datetimeformat@6`, `intl-relativetimeformat@11` — the 9.x / 7.x IIFEs carry a stray ESM import; pinned), patches the install guard to `shouldPolyfill('be')`, adds `be` / `ru` / `en` data and a tz subset (tenant zones + Minsk). `IntlPolyfill` in the root layout loads them `beforeInteractive` **only for `be`** (≈150 KB gzip once, nothing for RU / EN) → client output matches SSR («239 540», «19 жні 2026 — 17 вер 2026»), no hydration mismatch.
- e2e: `features/help/e2e/help.spec.ts` (sections, search → single section, article → screen link, empty search); `session/e2e/locale.spec.ts` now also asserts polyfilled `Intl` output under `be`.
