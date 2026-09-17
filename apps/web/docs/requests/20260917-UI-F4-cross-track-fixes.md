# Shared changes made while building UI-F4 (cross-track)
- From: UI-F4 · To: UI-0 · Blocking: no · Date: 2026-09-17

## What
| Path | Owner | Change |
| --- | --- | --- |
| `e2e/visual/visual.spec.ts` | UI-0 | Five new baselines: `analytics`, `analytics-locations`, `presence`, `presence-sync`, `rank`. |

## Why (screen / SDD ref)
S-ANL-01…08, S-PRS-01 (+ sync / platform / keywords), S-RNK-01 (SDD-01 §8–9, SDD-01T §6.2).

## Notes for other tracks
- `ReviewsTrendCard` and `PresenceTrendCard` (public, F4) got additive props `granularity` and `filters` / `platformIds`; F8 keeps working with the old signature.
- `@/features/review-analytics` now also exports `waitForExport`, `formatDuration`, `deltaOf`, `reviewLocationsRankingQueryOptions` — reusable by F8 (overview widgets) and F5.
