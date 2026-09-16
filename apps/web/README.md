# @lp/web — Local Presence Platform UI

Next.js 16 app (App Router, React 19, Tailwind v4, shadcn/ui on Base UI, TanStack Query/Table/Form, nuqs, next-intl) built on [next-shadcn-dashboard-starter](./UPSTREAM.md).

- Rules for agents and people: [AGENTS.md](./AGENTS.md) (section «Project rules (LP)»), [CLAUDE.md](./CLAUDE.md)
- Tracks: [docs/tracks](./docs/tracks), ownership in [tracks.json](./tracks.json)
- UX writing: [docs/UX_WRITING.md](./docs/UX_WRITING.md)
- Change log of the foundation: [../../docs/CHANGELOG.md](../../docs/CHANGELOG.md)

```bash
pnpm install            # from the repo root
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @lp/web mock:api   # mock core-api :4010
pnpm --filter @lp/web dev        # http://localhost:3000 → sign in as owner@example.ru / password
```
