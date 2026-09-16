import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface KwicRow {
  id: string;
  left: string;
  keyword: string;
  right: string;
  /** Optional trailing cells (rating, platform, date). */
  meta?: ReactNode;
}

export interface KwicTableProps {
  rows: KwicRow[];
  keyword: string;
  metaHeader?: ReactNode;
  onRowClick?: (row: KwicRow) => void;
  className?: string;
}

/** Concordance (keyword-in-context) table: context aligned on the keyword (S-ANL-08). */
export function KwicTable({ rows, keyword, metaHeader, onRowClick, className }: KwicTableProps) {
  const t = useTranslations('table');
  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <Table className='font-mono text-xs'>
        <TableHeader className='bg-muted'>
          <TableRow>
            <TableHead className='text-right'>…</TableHead>
            <TableHead className='text-center'>{keyword}</TableHead>
            <TableHead>…</TableHead>
            {metaHeader && <TableHead className='w-48 font-sans'>{metaHeader}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.id}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cn(onRowClick && 'cursor-pointer')}
            >
              <TableCell className='max-w-[40ch] truncate text-right' dir='rtl'>
                <span dir='ltr'>{r.left}</span>
              </TableCell>
              <TableCell className='bg-status-action-bg text-status-action text-center font-semibold whitespace-nowrap'>
                {r.keyword}
              </TableCell>
              <TableCell className='max-w-[40ch] truncate'>{r.right}</TableCell>
              {metaHeader && <TableCell className='font-sans'>{r.meta}</TableCell>}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={metaHeader ? 4 : 3} className='h-24 text-center font-sans'>
                {t('noResults')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
