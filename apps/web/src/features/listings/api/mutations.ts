import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { listingsKeys } from './queries';
import { actOnListing, linkListing } from './service';

export const actOnListingMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...listingsKeys.all, 'act_on_listing'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof actOnListing>[1] }) =>
      actOnListing(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: listingsKeys.all })
  });

export const linkListingMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...listingsKeys.all, 'link_listing'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof linkListing>[1] }) =>
      linkListing(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: listingsKeys.all })
  });
