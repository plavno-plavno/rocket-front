# Upstream: next-shadcn-dashboard-starter

| | |
|---|---|
| Repository | https://github.com/Kiranism/next-shadcn-dashboard-starter |
| Commit | `7705dfc0d13889e45c26a55ad5908da6a7a9a605` (2026-08-25, "chore(deps): upgrade @clerk/nextjs 7.3.5 → 7.8.1") |
| License | MIT — see `LICENSE.starter` (copyright notice preserved) |
| Imported | 2026-09-16, copied without git history (SDD-01 §1.3) |

## How to update

1. Clone upstream locally, `git diff 7705dfc..<new> -- <paths>`.
2. Port the relevant hunks by hand in a dedicated PR.
3. Record the new commit hash in this file.

## Deliberate deviations from upstream

| Area | Deviation | Reason |
|---|---|---|
| Package manager | bun → pnpm 10 workspace (`client.ui/` root). Removed `bun.lock`, `bunfig.toml`, `Dockerfile.bun`; `overrides` moved to `pnpm.overrides` | Monorepo on pnpm / Node 22 (SDD README §стек, SDD-01 §1.3) |
| Husky | Hooks live at the workspace root `.husky/` (git root). `pre-push` runs `typecheck` + `lint:strict` instead of `next build` | Git root is the workspace, not `apps/web`; full build on every push is too slow for parallel tracks |
| Dockerfile | Rewritten for pnpm workspace; build context is the repository root | Same |
| `.github/FUNDING.yml` | Removed | Not applicable |
| `LICENSE` | Renamed to `LICENSE.starter` | SDD-01 §1.3 |
| Docs (`AGENTS.md`, `README.md`, `docs/*.md`) | `bun …` → `pnpm …` | Same |

Further deviations (cleanup T1, auth T2, …) are logged in `client.ui/docs/CHANGELOG.md`.
