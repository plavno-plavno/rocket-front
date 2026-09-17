# Shared changes made while building UI-F5 (cross-track)
- From: UI-F5 · To: UI-0, UI-F1 · Blocking: no · Date: 2026-09-17

## What
| Path | Owner | Change |
| --- | --- | --- |
| `src/features/locations/components/location-picker.tsx` | UI-F1 | `DialogTrigger` gets `nativeButton={!trigger}` — a custom `trigger` is rendered inside a `<span>`, Base UI warned about non-native button semantics on every page using a custom trigger (media filters). Default trigger unchanged. |
| `e2e/visual/visual.spec.ts` | UI-0 | Three new baselines: `publications`, `products`, `duplicates` (media excluded — external images). |

## Why (screen / SDD ref)
S-PUB-01, S-MED-01, S-PRD-01, S-DUP-01 (SDD-01 §9).

## Notes for other tracks
- `@/features/media` now exports `mediaAssetsQueryOptions`, `listingMediaQueryOptions`, `mediaKeys` and the `MediaAsset` / `ListingMedia` types (used by publications and products pickers).
