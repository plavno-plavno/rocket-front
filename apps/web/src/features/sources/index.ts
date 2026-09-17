/** Public API of the sources feature (platform registry is consumed by many tracks). */
export {
  platformsQueryOptions,
  platformAccountsQueryOptions,
  complaintReasonsQueryOptions,
  sourceKeys
} from './api/queries';
export type { Platform, PlatformAccount, PlatformKind, ConnectorHealth } from './api/types';
export { sourceSettingsQueryOptions } from './api/queries';
export {
  createPlatformAccountMutation,
  deletePlatformAccountMutation,
  startOAuthMutation,
  checkPlatformAccountMutation,
  updateSourceSettingsMutation
} from './api/mutations';
export type { SourceSettings, PlatformAccountCreate } from './api/types';
