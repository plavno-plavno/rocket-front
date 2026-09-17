import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { locationQueryOptions } from '@/features/locations/api/queries';
import { getLocation } from '@/features/locations/api/service';
import { LocationDetail } from '@/features/locations/components/location-detail/location-detail';
import { requireAccess } from '@/features/session/server';
import { isApiError } from '@/lib/api';
import { getQueryClient } from '@/lib/query-client';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const location = await getLocation(id);
    return { title: location.name };
  } catch {
    return { title: (await getTranslations('locations.detail'))('notFound') };
  }
}

/** S-LOC-03 — owned by UI-F1. Prefetches the location; 404 when it does not exist. */
export default async function LocationPage({ params }: Props) {
  const { id } = await params;
  const access = await requireAccess({ permission: 'locations.read' });
  if (!access) {
    return (
      <PageContainer access={false}>
        <span />
      </PageContainer>
    );
  }
  const queryClient = getQueryClient();
  try {
    await queryClient.fetchQuery(locationQueryOptions(id));
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <PageContainer isLoading>
            <span />
          </PageContainer>
        }
      >
        <LocationDetail id={id} />
      </Suspense>
    </HydrationBoundary>
  );
}
