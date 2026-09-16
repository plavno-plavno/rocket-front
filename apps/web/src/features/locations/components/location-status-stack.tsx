'use client';

import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { locationListingsQueryOptions } from '../api/queries';
import { ListingStatusStack } from './listing-status-stack';

/** Public: platform status stack for a location id (used by F2 review details, F8 overview). */
export function LocationStatusStack({ locationId, max }: { locationId: string; max?: number }) {
  const { data, isPending } = useQuery(locationListingsQueryOptions(locationId));
  if (isPending) return <Skeleton className='h-5 w-32' />;
  return (
    <ListingStatusStack
      statuses={(data?.items ?? []).map((l) => ({
        listing_id: l.id,
        platform_id: l.platform_id,
        sync_status: l.sync_status,
        action_reason: l.action_reason,
        url: l.url ?? null
      }))}
      max={max}
    />
  );
}
