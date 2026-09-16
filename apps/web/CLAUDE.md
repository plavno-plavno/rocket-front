# CLAUDE.md

Web UI of the Local Presence Platform — Next.js 16 + shadcn/ui (Base UI) on the `next-shadcn-dashboard-starter` base.

Read, in this order:
1. **[AGENTS.md → «Project rules (LP)»](./AGENTS.md#project-rules-lp--read-this-first)** — where code lives, data layer, i18n, tracks, commands.
2. **`docs/tracks/<your track>.md`** — what your track owns and its DoD (`tracks.json` has the globs).
3. **[docs/UX_WRITING.md](./docs/UX_WRITING.md)** — tone, terminology, formats, states.
4. The SDD (lives next to the repo, `rocketdata/docs`): `../../../docs/01-ui.md` (screens §8–9), `../../../docs/01T-ui-tracks.md`, `../../../docs/00-contracts.md`.
5. Starter docs when needed: [docs/forms.md](./docs/forms.md), [docs/themes.md](./docs/themes.md), [docs/deployment.md](./docs/deployment.md).

Critical conventions (details in AGENTS.md): types only from `@lp/contracts`; HTTP only in `api/service.ts`; icons only from `@/components/icons`; every string via next-intl; every page renders a `components/lp` template; change only your track's paths; run `pnpm gen --check && pnpm typecheck && pnpm lint:strict && pnpm format:check && pnpm check:templates && pnpm depcruise` before pushing.
