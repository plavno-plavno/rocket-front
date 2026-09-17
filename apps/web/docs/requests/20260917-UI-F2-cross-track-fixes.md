# Shared changes made while building UI-F2 (cross-track)
- From: UI-F2 · To: UI-DS, UI-0, UI-F1, UI-F7 · Blocking: no · Date: 2026-09-17

## What
| Path | Owner | Change |
| --- | --- | --- |
| `src/components/lp/templates/inbox-page.tsx` | UI-DS | Phone layout (< 768px): KPI strip scrolls horizontally; list ↔ detail switch driven by `?<detailParam>=` with a «Назад» bar. New optional prop `detailParam` (default `id`). |
| `src/components/layout/page-container.tsx` | UI-0 | Header stacks title/actions on narrow screens; root gets `w-full min-w-0` so wide children (KPI strip) cannot stretch the page (was 960px at 390px). |
| `playwright.config.ts` | UI-0 | Desktop project ignores `*.mobile.spec.ts` (they run in the `mobile` project only). |
| `src/features/sources/{api/service,api/queries,index}.ts` | UI-F1 | `complaintReasonsQueryOptions(platformId)` added to the public API (used by the inbox complaint dialog). |
| `src/features/users/components/user-combobox.tsx` | UI-F7 | Shows «…» while members load instead of an empty trigger. |

## Why (screen / SDD ref)
S-REV-01 (complaint dialog, 390px inbox per SDD-01T §6.2), S-QA-01.

## Proposed interface
Implemented — additive only.

## Temporary workaround
None.
