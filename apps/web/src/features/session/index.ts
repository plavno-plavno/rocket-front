/**
 * Public API of the session feature (SDD-01T §3.5). Other features import only from here.
 */
export { useMe, useCan, useHasFeature, useAccess } from './hooks/use-me';
export { meQueryOptions, badgesQueryOptions, sessionKeys } from './api/queries';
export type { Me, Badges, Role, Action, PlanFeature } from './api/types';
export { TenantSwitcher } from './components/tenant-switcher';
export { UserNav } from './components/user-nav';
export { LanguageSwitcher } from './components/language-switcher';
export { SessionProvider } from './components/session-provider';
export { updateProfileMutation, changePasswordMutation } from './api/mutations';
