'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { Icons } from '@/components/icons';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { platformsQueryOptions } from '@/features/sources';
import type { Option } from '@/types/data-table';
import { locationGroupsQueryOptions, locationsQueryOptions } from '../../api/queries';
import type { LocationListItem } from '../../api/types';
import { locationsSearchParams, toLocationListQuery } from '../../searchparams';
import { useLocationColumns } from './columns';
import { LocationBulkBar } from './bulk-bar';

const SYNC_STATUSES = [
  'synced',
  'sent',
  'action_required',
  'error',
  'not_connected',
  'unsupported'
] as const;
const LOCATION_STATUSES = [
  'open',
  'temporarily_closed',
  'coming_soon',
  'permanently_closed'
] as const;

/**
 * «Мои компании» table (S-LOC-01): URL state via nuqs (`shallow`), `useQuery`-style refetch on
 * pagination/filter without RSC round-trips, faceted filters fed by platforms and groups.
 */
export function LocationTable() {
  const [params] = useQueryStates(locationsSearchParams, { shallow: true });
  const query = useMemo(() => toLocationListQuery(params), [params]);
  const { data, isFetching } = useSuspenseQuery(locationsQueryOptions(query));
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data: groups } = useQuery(locationGroupsQueryOptions());
  const tStatus = useTranslations('status');
  const tLoc = useTranslations('locations.status');
  const tEmpty = useTranslations('locations.list.empty');

  const options = useMemo(
    () => ({
      cities: uniqueCities(data.items, groups?.items ?? []),
      groups: (groups?.items ?? []).map<Option>((g) => ({
        label: g.name,
        value: g.id,
        count: g.location_count
      })),
      platforms: (platforms?.items ?? []).map<Option>((p) => ({ label: p.name, value: p.id })),
      syncStatuses: SYNC_STATUSES.map<Option>((s) => ({ label: tStatus(s), value: s })),
      statuses: LOCATION_STATUSES.map<Option>((s) => ({ label: tLoc(s), value: s }))
    }),
    [data.items, groups, platforms, tStatus, tLoc]
  );
  const columns = useLocationColumns(options);
  const pageCount = Math.max(1, Math.ceil(data.meta.total / params.perPage));

  const { table } = useDataTable({
    data: data.items,
    columns,
    pageCount,
    rowCount: data.meta.total,
    shallow: true,
    debounceMs: 400,
    getRowId: (row) => row.id,
    initialState: {
      columnPinning: { left: ['select', 'name'], right: ['actions'] },
      columnVisibility: { group: false, syncStatus: false, platform: false, status: false },
      pagination: { pageSize: 25, pageIndex: 0 }
    }
  });

  const isFiltered = table.getState().columnFilters.length > 0 || !!params.name;

  return (
    <DataTable
      table={table}
      density='compact'
      actionBar={<LocationBulkBar table={table} />}
      emptyState={
        <Empty className='py-8'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.locations />
            </EmptyMedia>
            <EmptyTitle>{isFiltered ? tEmpty('filtered') : tEmpty('title')}</EmptyTitle>
            {!isFiltered && <EmptyDescription>{tEmpty('description')}</EmptyDescription>}
          </EmptyHeader>
        </Empty>
      }
    >
      <DataTableToolbar table={table}>
        {isFetching && (
          <Icons.spinner className='text-muted-foreground size-4 animate-spin' aria-hidden />
        )}
      </DataTableToolbar>
    </DataTable>
  );
}

/** City facet: from city groups (complete list with counts) or, failing that, from the current page. */
function uniqueCities(
  items: LocationListItem[],
  groups: { kind: string; name: string; location_count: number }[]
): Option[] {
  const cityGroups = groups.filter((g) => g.kind === 'city');
  if (cityGroups.length)
    return cityGroups.map((g) => ({ label: g.name, value: g.name, count: g.location_count }));
  return [...new Set(items.map((i) => i.address.city))]
    .toSorted()
    .map((c) => ({ label: c, value: c }));
}
