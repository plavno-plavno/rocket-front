import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { locationKeys } from './queries';
import {
  actOnListing,
  applyLocationImport,
  setLocationImportMapping,
  uploadLocationImport,
  bulkUpdateLocations,
  createLocation,
  createLocationGroup,
  deleteLocation,
  deleteLocationGroup,
  exportLocations,
  previewLocationSync,
  retrySyncBatch,
  rollbackLocation,
  updateLocation,
  updateLocationGroup
} from './service';
import type {
  ListingAction,
  LocationBulkRequest,
  LocationGroupCreate,
  LocationUpdate
} from './types';

export const createLocationMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'create'],
    mutationFn: createLocation,
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.all })
  });

export const updateLocationMutation = (qc: QueryClient, id: string) =>
  mutationOptions({
    mutationKey: [...locationKeys.detail(id), 'update'],
    mutationFn: (body: LocationUpdate) => updateLocation(id, body),
    onSuccess: (location) => {
      qc.setQueryData(locationKeys.detail(id), location);
      void qc.invalidateQueries({ queryKey: locationKeys.lists() });
      void qc.invalidateQueries({ queryKey: locationKeys.versions(id) });
    }
  });

export const deleteLocationMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'delete'],
    mutationFn: deleteLocation,
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.all })
  });

export const rollbackLocationMutation = (qc: QueryClient, id: string) =>
  mutationOptions({
    mutationKey: [...locationKeys.detail(id), 'rollback'],
    mutationFn: (version: number) => rollbackLocation(id, version),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.detail(id) })
  });

export const previewSyncMutation = (id: string) =>
  mutationOptions({
    mutationKey: [...locationKeys.detail(id), 'preview-sync'],
    mutationFn: (body: LocationUpdate) => previewLocationSync(id, body)
  });

export const bulkUpdateLocationsMutation = (qc: QueryClient, scope: string) =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'bulk'],
    mutationFn: (body: LocationBulkRequest) => bulkUpdateLocations(scope, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.lists() })
  });

export const exportLocationsMutation = (scope: string) =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'export'],
    mutationFn: (input: { format: 'xlsx' | 'csv'; filters?: Record<string, unknown> }) =>
      exportLocations(scope, input.format, input.filters)
  });

export const retrySyncBatchMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'batch-retry'],
    mutationFn: retrySyncBatch,
    onSuccess: (batch) => qc.invalidateQueries({ queryKey: locationKeys.batch(batch.id) })
  });

export const createLocationGroupMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'group-create'],
    mutationFn: createLocationGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.groups() })
  });

export const updateLocationGroupMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'group-update'],
    mutationFn: ({ id, body }: { id: string; body: LocationGroupCreate }) =>
      updateLocationGroup(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.groups() })
  });

export const deleteLocationGroupMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'group-delete'],
    mutationFn: deleteLocationGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.groups() })
  });

export const listingActionMutation = (qc: QueryClient, locationId: string) =>
  mutationOptions({
    mutationKey: [...locationKeys.detail(locationId), 'listing-action'],
    mutationFn: ({ id, action }: { id: string; action: ListingAction }) => actOnListing(id, action),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: locationKeys.listings(locationId) });
      void qc.invalidateQueries({ queryKey: locationKeys.detail(locationId) });
      void qc.invalidateQueries({ queryKey: locationKeys.lists() });
    }
  });

export const uploadImportMutation = () =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'import-upload'],
    mutationFn: uploadLocationImport
  });
export const importMappingMutation = () =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'import-mapping'],
    mutationFn: ({ importId, mapping }: { importId: string; mapping: Record<string, string> }) =>
      setLocationImportMapping(importId, mapping)
  });
export const applyImportMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...locationKeys.all, 'import-apply'],
    mutationFn: applyLocationImport,
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.all })
  });
