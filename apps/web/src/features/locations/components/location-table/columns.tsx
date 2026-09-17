'use client';

import type { Column, ColumnDef } from '@tanstack/react-table';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Option } from '@/types/data-table';
import type { LocationListItem } from '../../api/types';
import { ListingStatusStack } from '../listing-status-stack';
import { CellAction } from './cell-action';

export interface LocationColumnOptions {
  cities: Option[];
  groups: Option[];
  platforms: Option[];
  syncStatuses: Option[];
  statuses: Option[];
}

/** Column ids double as URL filter keys (see `searchparams.ts`). */
export function useLocationColumns(options: LocationColumnOptions): ColumnDef<LocationListItem>[] {
  const t = useTranslations('locations.list.columns');
  const tf = useTranslations('locations.list.filters');
  const ts = useTranslations('locations.status');
  const tc = useTranslations('table');
  const format = useFormatter();

  return useMemo<ColumnDef<LocationListItem>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={tc('selectAll')}
            className='translate-y-0.5'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={tc('selectRow')}
            className='translate-y-0.5'
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 48
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }: { column: Column<LocationListItem, unknown> }) => (
          <DataTableColumnHeader column={column} title={t('name')} />
        ),
        cell: ({ row }) => (
          <div className='flex w-64 min-w-0 flex-col py-1'>
            <Link
              href={`/dashboard/locations/${row.original.id}`}
              className='font-medium whitespace-normal hover:underline'
            >
              {row.original.name}
            </Link>
            {row.original.status !== 'open' && (
              <Badge variant='outline' className='mt-0.5 w-fit text-[11px]'>
                {ts(row.original.status)}
              </Badge>
            )}
          </div>
        ),
        meta: { label: t('name'), placeholder: tf('search'), variant: 'text', icon: Icons.search },
        enableColumnFilter: true,
        size: 280
      },
      {
        id: 'address',
        accessorFn: (row) =>
          row.address.free_form ??
          `${row.address.city}, ${row.address.street ?? ''} ${row.address.house ?? ''}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('address')} />,
        cell: ({ getValue }) => (
          <span className='text-muted-foreground block w-60 text-sm whitespace-normal'>
            {getValue<string>()}
          </span>
        ),
        enableSorting: false,
        meta: { label: t('address') },
        size: 260
      },
      {
        id: 'branch_code',
        accessorKey: 'branch_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('branchCode')} />,
        cell: ({ getValue }) => (
          <span className='font-mono text-xs'>{getValue<string | null>() ?? '—'}</span>
        ),
        meta: { label: t('branchCode') },
        size: 110
      },
      {
        id: 'city',
        accessorFn: (row) => row.address.city,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('city')} />,
        cell: ({ getValue }) => getValue<string>(),
        meta: {
          label: tf('city'),
          variant: 'multiSelect',
          options: options.cities,
          icon: Icons.mapPin
        },
        enableColumnFilter: true,
        size: 140
      },
      {
        id: 'platforms',
        accessorKey: 'listing_statuses',
        header: () => t('platforms'),
        cell: ({ row }) => <ListingStatusStack statuses={row.original.listing_statuses} />,
        enableSorting: false,
        meta: { label: t('platforms') },
        size: 280
      },
      {
        id: 'group',
        accessorFn: (row) => row.group_ids?.join(',') ?? '',
        header: () => tf('group'),
        cell: () => null,
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: true,
        meta: {
          label: tf('group'),
          variant: 'multiSelect',
          options: options.groups,
          icon: Icons.locations
        },
        size: 0
      },
      {
        id: 'syncStatus',
        accessorFn: () => '',
        header: () => tf('syncStatus'),
        cell: () => null,
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: true,
        meta: {
          label: tf('syncStatus'),
          variant: 'multiSelect',
          options: options.syncStatuses,
          icon: Icons.circleCheck
        },
        size: 0
      },
      {
        id: 'platform',
        accessorFn: () => '',
        header: () => tf('platform'),
        cell: () => null,
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: true,
        meta: {
          label: tf('platform'),
          variant: 'multiSelect',
          options: options.platforms,
          icon: Icons.sources
        },
        size: 0
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => tf('status'),
        cell: () => null,
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: true,
        meta: { label: tf('status'), variant: 'multiSelect', options: options.statuses },
        size: 0
      },
      {
        id: 'updated_at',
        accessorKey: 'updated_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('updatedAt')} />,
        cell: ({ getValue }) => (
          <span className='text-muted-foreground text-xs whitespace-nowrap'>
            {format.dateTime(new Date(getValue<string>()), 'medium')}
          </span>
        ),
        meta: { label: t('updatedAt') },
        size: 120
      },
      {
        id: 'actions',
        cell: ({ row }) => <CellAction data={row.original} />,
        enableSorting: false,
        enableHiding: false,
        size: 64
      }
    ],
    [t, tf, ts, tc, format, options]
  );
}
