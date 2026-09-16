'use client';

import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { SyncStatusBadge } from '@/components/lp';
import { DataTable } from '@/components/ui/table/data-table';

type Row = {
  id: string;
  name: string;
  city: string;
  status: 'synced' | 'sent' | 'action_required';
};
const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Сочи', 'Омск'];

/** 1 000 rows through the real DataTable to exercise windowing. */
export function VirtualTableDemo() {
  const data = useMemo<Row[]>(
    () =>
      Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        name: `Компания #${i + 1}`,
        city: CITIES[i % CITIES.length],
        status: i % 13 === 0 ? 'action_required' : i % 5 === 0 ? 'sent' : 'synced'
      })),
    []
  );
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { id: 'name', accessorKey: 'name', header: 'Название', size: 240 },
      { id: 'city', accessorKey: 'city', header: 'Город' },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ getValue }) => <SyncStatusBadge status={getValue<Row['status']>()} compact />
      }
    ],
    []
  );
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: 1,
    rowCount: data.length,
    getRowId: (r) => r.id
  });
  return (
    <div className='flex h-96 flex-col'>
      <DataTable table={table} density='compact' />
    </div>
  );
}
