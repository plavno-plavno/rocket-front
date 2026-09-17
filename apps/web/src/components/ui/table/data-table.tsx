'use client';

import { type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/lib/data-table';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  /** `compact` = 36px rows, text-sm (default for locations, reviews, duplicates — SDD-01 §3.2). */
  density?: 'comfortable' | 'compact';
  /** Custom empty state (defaults to a localized "No results"). */
  emptyState?: React.ReactNode;
  /** Rows above this count are virtualised (SDD-01 §3.2). */
  virtualizeFrom?: number;
}

const ROW_HEIGHT = { comfortable: 52, compact: 36 } as const;

/**
 * Data table with sticky header, column pinning, density and windowing for long pages
 * (`@tanstack/react-virtual`, on when the page has more than `virtualizeFrom` rows).
 */
export function DataTable<TData>({
  table,
  actionBar,
  children,
  density = 'comfortable',
  emptyState,
  virtualizeFrom = 200
}: DataTableProps<TData>) {
  const t = useTranslations('table');
  const rows = table.getRowModel().rows;
  const virtual = rows.length > virtualizeFrom;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT[density],
    overscan: 12
  });
  const items = virtualizer.getVirtualItems();
  const paddingTop = virtual && items.length ? items[0].start : 0;
  const paddingBottom =
    virtual && items.length ? virtualizer.getTotalSize() - items[items.length - 1].end : 0;
  // Before mount (SSR) the virtualizer has no measurements → render the first window statically.
  const renderRows = virtual
    ? items.length
      ? items.map((v) => rows[v.index])
      : rows.slice(0, 40)
    : rows;
  const columnCount = table.getAllColumns().length;

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      {children}
      <div className='relative flex flex-1'>
        {/* Below md the page scrolls as a whole (no fixed height): the table sits in the flow with a
            capped height; from md it fills the remaining viewport height. */}
        <div className='flex w-full overflow-hidden rounded-lg border md:absolute md:inset-0'>
          <div
            ref={scrollRef}
            className='h-full max-h-[70dvh] w-full overflow-auto md:max-h-none'
            data-virtualized={virtual || undefined}
          >
            <Table
              className={cn(density === 'compact' && 'text-sm [&_td]:py-1.5 [&_th]:h-9 [&_tr]:h-9')}
              data-density={density}
            >
              <TableHeader className='bg-muted sticky top-0 z-10'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ ...getCommonPinningStyles({ column: header.column }) }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {paddingTop > 0 && (
                  <tr aria-hidden>
                    <td style={{ height: paddingTop, padding: 0 }} colSpan={columnCount}>
                      {'\u00a0'}
                    </td>
                  </tr>
                )}
                {renderRows.length ? (
                  renderRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      data-index={row.index}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{ ...getCommonPinningStyles({ column: cell.column }) }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columnCount} className='h-24 text-center'>
                      {emptyState ?? t('noResults')}
                    </TableCell>
                  </TableRow>
                )}
                {paddingBottom > 0 && (
                  <tr aria-hidden>
                    <td style={{ height: paddingBottom, padding: 0 }} colSpan={columnCount}>
                      {'\u00a0'}
                    </td>
                  </tr>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-2.5'>
        <DataTablePagination table={table} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </div>
    </div>
  );
}
