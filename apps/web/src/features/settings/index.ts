/**
 * Public API of the settings feature (SDD-01T §3.5). Other features import only from here.
 * Keep exports additive; breaking changes need a cross-track PR.
 */
export { SettingsNav } from './components/settings-nav';
export { tenantQueryOptions, settingsKeys } from './api/queries';
export type { Tenant } from './api/types';
export { ConnectAccountDialog } from './components/accounts-settings';
