# Shared changes made while building UI-F6 (cross-track)
- From: UI-F6 · To: UI-0 · Blocking: no · Date: 2026-09-17

## What
| Path | Owner | Change |
| --- | --- | --- |
| `e2e/visual/visual.spec.ts` | UI-0 | Three new baselines: `campaigns`, `widgets`, `communication`. |

## Why (screen / SDD ref)
S-GEN-01, S-WID-01, Сторлокатор (Beta), S-COM-01 (SDD-01 §9, H-UI-05).

## Notes for other tracks
- `@/features/widgets` exports `WidgetConfigurator` / `WidgetConfig` — the store-locator feature reuses it; the `/widgets*` mock handlers live in the widgets feature only (the store-locator mock file stays empty to avoid duplicate routes).
- `@/features/review-analytics` `waitForExport` is reused for the QR PDF export.
