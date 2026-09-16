/**
 * Public API of the locations feature (SDD-01T §3.5). Other features import only from here.
 * Stubs (LocationPicker, LocationStatusStack, ActionRequiredList) are filled in by track UI-F1.
 */
export {
  locationKeys,
  locationsQueryOptions,
  locationQueryOptions,
  locationGroupsQueryOptions
} from './api/queries';
export type {
  Location,
  LocationListItem,
  LocationGroup,
  LocationStatus,
  SyncStatus,
  ListingStatusBrief
} from './api/types';
