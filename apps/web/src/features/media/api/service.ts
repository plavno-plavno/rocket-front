import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListMediaAssetsQuery, ListListingMediaQuery } from './types';

/** GET /media — Own media library */
export async function listMediaAssets(params?: ListMediaAssetsQuery) {
  const { data } = await coreClient().GET('/media', { params: { query: query(params ?? {}) } });
  return data!;
}

/** POST /media — Upload a media asset */
export async function uploadMediaAsset(form: FormData) {
  const { data } = await coreClient().POST('/media', {
    body: form as never,
    bodySerializer: ((b: unknown) => b as FormData) as never
  });
  return data!;
}

/** DELETE /media/{id} — Delete asset */
export async function deleteMediaAsset(id: string) {
  await coreClient().DELETE('/media/{id}', { params: { path: { id } } });
}

/** GET /media/listing-media — Photos observed on listings (own + UGC) */
export async function listListingMedia(params?: ListListingMediaQuery) {
  const { data } = await coreClient().GET('/media/listing-media', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /media/listing-media/{id}/actions — Flag or delete a listing photo */
export async function actOnListingMedia(id: string, body: OperationBody<'act_on_listing_media'>) {
  const { data } = await coreClient().POST('/media/listing-media/{id}/actions', {
    params: { path: { id } },
    body
  });
  return data!;
}
