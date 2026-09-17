# Shared fixes made while building UI-F1 (cross-track)
- From: UI-F1 · To: UI-0, UI-DS · Blocking: no · Date: 2026-09-17

## What
Small fixes/additions in shared code, done on the UI-F1 branch to unblock the locations & sources screens (PR label `cross-track`):

| Path | Owner | Change |
| --- | --- | --- |
| `src/components/forms/fields/select-field.tsx` | UI-0 | Render option **labels** in the trigger (`SelectValue` children renderer); Base UI shows the raw value otherwise. |
| `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx` | UI-DS | sr-only «Close» → `common.close` (Russian by default). |
| `src/components/icons/sets/common.ts` | UI-DS | `history`, `copy`, `download`, `eye`, `mapPin`, `circleDashed`, `locations`, `sources`, `globe`. |
| `src/shell/breadcrumb-store.ts`, `src/hooks/use-breadcrumbs.tsx` | UI-0 | `useBreadcrumbTitle(path, title)` — dynamic segment titles (location name, «Импорт компаний»). |
| `src/shell/messages/*.json` | UI-0 | `common.download`, `common.exportReady`. |
| `src/features/exports/mocks/handlers.ts`, `mocks/server.ts` | UI-0 | `GET /exports`, `GET /exports/{id}` mocks + `/__mock/exports/:file` download stub. |

## Why (screen / SDD ref)
S-LOC-01 (bulk export needs export polling), S-LOC-02 (breadcrumb of the wizard), S-LOC-03 (select labels in the card), UX_WRITING (no English strings by default).

## Proposed interface
Already implemented — additive only; no public API changed.

## Temporary workaround
None needed.
