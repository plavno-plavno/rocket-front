# Shared changes made while building UI-F7 (cross-track)
- From: UI-F7 · To: UI-0, UI-DS, UI-F1 · Blocking: no · Date: 2026-09-17

## What
| Path | Owner | Change |
| --- | --- | --- |
| `src/features/session/index.ts` | UI-0 | Additive exports `updateProfileMutation`, `changePasswordMutation` (S-SET-02 profile / password cards). |
| `src/features/sources/index.ts` | UI-F1 | Additive exports `sourceSettingsQueryOptions`, `createPlatformAccountMutation`, `deletePlatformAccountMutation`, `startOAuthMutation`, `checkPlatformAccountMutation`, `updateSourceSettingsMutation`, types `SourceSettings`, `PlatformAccountCreate` (S-SET-03 / S-SET-06 consume the platform-accounts API through the sources feature instead of duplicating the service). |
| `src/components/lp/templates/settings-page.tsx` | UI-DS | New optional prop `wide?: boolean` — table-heavy settings screens (users, accounts, integrations, notification rules) use the full width instead of the ~800px column; default unchanged. |
| `e2e/visual/visual.spec.ts` | UI-0 | Five new baselines: `settings-users`, `settings-accounts`, `settings-integrations`, `notifications`, `onboarding`. |
| `.gitignore` | UI-0 | `.scratch/` for throwaway Playwright scripts run from `apps/web`. |

## Why (screen / SDD ref)
S-SET-01…06, S-NOT-01, S-ONB-01 (SDD-01 §8 «S-SET-01», §9; SDD-01T §3.5 public API of UI-F7).

## Proposed interface
Implemented — additive only. Nothing to do for the owners; listed for awareness.
