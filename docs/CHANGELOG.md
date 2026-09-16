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
