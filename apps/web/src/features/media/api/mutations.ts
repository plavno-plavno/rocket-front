import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { mediaKeys } from './queries';
import { uploadMediaAsset, deleteMediaAsset, actOnListingMedia } from './service';

export const uploadMediaAssetMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...mediaKeys.all, 'upload_media_asset'],
    mutationFn: ({ form }: { form: FormData }) => uploadMediaAsset(form),
    onSuccess: () => qc.invalidateQueries({ queryKey: mediaKeys.all })
  });

export const deleteMediaAssetMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...mediaKeys.all, 'delete_media_asset'],
    mutationFn: ({ id }: { id: string }) => deleteMediaAsset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: mediaKeys.all })
  });

export const actOnListingMediaMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...mediaKeys.all, 'act_on_listing_media'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof actOnListingMedia>[1] }) =>
      actOnListingMedia(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: mediaKeys.all })
  });
