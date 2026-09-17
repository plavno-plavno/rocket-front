import { coreClient, query } from '@/lib/api';
import type {
  ListingAction,
  LocationBulkRequest,
  LocationCreate,
  LocationGroupCreate,
  LocationListQuery,
  LocationUpdate
} from './types';

export async function listLocations(params: LocationListQuery) {
  const { data } = await coreClient().GET('/locations', { params: { query: query(params) } });
  return data!;
}

export async function getLocation(id: string) {
  const { data } = await coreClient().GET('/locations/{id}', { params: { path: { id } } });
  return data!;
}

export async function createLocation(body: LocationCreate) {
  const { data } = await coreClient().POST('/locations', { body });
  return data!;
}

export async function updateLocation(id: string, body: LocationUpdate) {
  const { data } = await coreClient().PUT('/locations/{id}', { params: { path: { id } }, body });
  return data!;
}

export async function deleteLocation(id: string) {
  await coreClient().DELETE('/locations/{id}', { params: { path: { id } } });
}

export async function listLocationVersions(id: string) {
  const { data } = await coreClient().GET('/locations/{id}/versions', { params: { path: { id } } });
  return data!;
}

export async function rollbackLocation(id: string, version: number) {
  const { data } = await coreClient().POST('/locations/{id}/versions/{version}/rollback', {
    params: { path: { id, version } }
  });
  return data!;
}

export async function listLocationListings(id: string) {
  const { data } = await coreClient().GET('/locations/{id}/listings', { params: { path: { id } } });
  return data!;
}

export async function previewLocationSync(id: string, body: LocationUpdate) {
  const { data } = await coreClient().POST('/locations/{id}/preview-sync', {
    params: { path: { id } },
    body
  });
  return data!;
}

export async function bulkUpdateLocations(scope: string, body: LocationBulkRequest) {
  const { data } = await coreClient().POST('/locations/bulk', {
    params: { query: { scope } },
    body
  });
  return data!;
}

export async function exportLocations(
  scope: string,
  format: 'xlsx' | 'csv',
  filters?: Record<string, unknown>
) {
  const { data } = await coreClient().POST('/locations/export', {
    params: { query: { scope } },
    body: { format, filters }
  });
  return data!;
}

export async function listLocationGroups(kind?: string) {
  const { data } = await coreClient().GET('/location-groups', {
    params: { query: query({ 'filter[kind]': kind as never }) }
  });
  return data!;
}

export async function createLocationGroup(body: LocationGroupCreate) {
  const { data } = await coreClient().POST('/location-groups', { body });
  return data!;
}

export async function updateLocationGroup(id: string, body: LocationGroupCreate) {
  const { data } = await coreClient().PUT('/location-groups/{id}', {
    params: { path: { id } },
    body
  });
  return data!;
}

export async function deleteLocationGroup(id: string) {
  await coreClient().DELETE('/location-groups/{id}', { params: { path: { id } } });
}

export async function getSyncBatch(id: string) {
  const { data } = await coreClient().GET('/sync-batches/{id}', { params: { path: { id } } });
  return data!;
}

export async function listSyncBatchItems(id: string, page = 1, pageSize = 50) {
  const { data } = await coreClient().GET('/sync-batches/{id}/items', {
    params: { path: { id }, query: { page, page_size: pageSize } }
  });
  return data!;
}

export async function retrySyncBatch(id: string) {
  const { data } = await coreClient().POST('/sync-batches/{id}/retry', {
    params: { path: { id } }
  });
  return data!;
}

export async function getListingsSummary(scope: string, platformKind?: 'map' | 'navigator') {
  const { data } = await coreClient().GET('/listings/summary', {
    params: { query: query({ scope, 'filter[platform_kind]': platformKind }) }
  });
  return data!;
}

export async function actOnListing(id: string, action: ListingAction, note?: string) {
  const { data } = await coreClient().POST('/listings/{id}/actions', {
    params: { path: { id } },
    body: { action, note }
  });
  return data!;
}

export async function uploadLocationImport(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await coreClient().POST('/locations/import', {
    body: form as never,
    bodySerializer: ((b: unknown) => b as FormData) as never
  });
  return data!;
}

export async function setLocationImportMapping(importId: string, mapping: Record<string, string>) {
  const { data } = await coreClient().POST('/locations/import/{id}/mapping', {
    params: { path: { id: importId } },
    body: { mapping }
  });
  return data!;
}

export async function applyLocationImport(importId: string) {
  const { data } = await coreClient().POST('/locations/import/{id}/apply', {
    params: { path: { id: importId } }
  });
  return data!;
}

export async function getExport(id: string) {
  const { data } = await coreClient().GET('/exports/{id}', { params: { path: { id } } });
  return data!;
}
