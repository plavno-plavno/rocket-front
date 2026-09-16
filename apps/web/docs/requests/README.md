# Requests to other tracks (SDD-01T §5.3)

One file per request: `YYYYMMDD-<from-track>-<slug>.md`. No shared index, no conflicts.

```markdown
# <short title>
- From: UI-F2 · To: UI-F3 · Blocking: yes/no · Date: 2026-09-20
## What
## Why (screen / SDD ref)
## Proposed interface (props / endpoint / token)
## Temporary workaround (features/<f>/components/_local/… with // TODO(request: <file>))
```

SLA: UI-0 and UI-DS — 1 working day; feature tracks — 2 days. Contract gaps go to `packages/contracts/CHANGE_REQUESTS.md` instead.
