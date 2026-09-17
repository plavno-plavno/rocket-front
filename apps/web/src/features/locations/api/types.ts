import type { OperationQuery, Schema } from '@lp/contracts';

// Re-exports only (SDD-01 §5.1).
export type Location = Schema<'Location'>;
export type LocationListItem = Schema<'LocationListItem'>;
export type LocationCreate = Schema<'LocationCreate'>;
export type LocationUpdate = Schema<'LocationUpdate'>;
export type LocationVersion = Schema<'LocationVersion'>;
export type LocationGroup = Schema<'LocationGroup'>;
export type LocationGroupCreate = Schema<'LocationGroupCreate'>;
export type LocationStatus = Schema<'LocationStatus'>;
export type LocationBulkRequest = Schema<'LocationBulkRequest'>;
export type SyncBatch = Schema<'SyncBatch'>;
export type SyncBatchItem = Schema<'SyncBatchItem'>;
export type PreviewSyncResponse = Schema<'PreviewSyncResponse'>;
export type ImportUploadResponse = Schema<'ImportUploadResponse'>;
export type ImportPreviewResponse = Schema<'ImportPreviewResponse'>;
export type Address = Schema<'Address'>;
export type ListingStatusBrief = Schema<'ListingStatusBrief'>;
export type ListingStatusCounts = Schema<'ListingStatusCounts'>;
export type SyncStatus = Schema<'SyncStatus'>;
export type PlatformKind = Schema<'PlatformKind'>;

/** Query params of `GET /locations` as the contract defines them. */
export type LocationListQuery = OperationQuery<'list_locations'>;
export type Listing = Schema<'Listing'>;
export type ListingAction = Schema<'ListingAction'>['action'];
