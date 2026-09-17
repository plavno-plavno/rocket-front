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
            {/* Half the width to each context, the keyword column shrinks to the word: it used to
                take all the free space and squeeze the context into a few characters. */}
            <TableHead className='w-1/2 font-sans text-right'>{t('contextBefore')}</TableHead>
            <TableHead className='w-px text-center whitespace-nowrap'>{keyword}</TableHead>
            <TableHead className='w-1/2 font-sans'>{t('contextAfter')}</TableHead>
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
              <TableCell className='w-1/2 max-w-0 truncate text-right' dir='rtl'>
                <span dir='ltr'>{r.left}</span>
              </TableCell>
              <TableCell className='bg-primary/10 text-foreground w-px px-3 text-center font-semibold whitespace-nowrap'>
                {r.keyword}
              </TableCell>
              <TableCell className='w-1/2 max-w-0 truncate'>{r.right}</TableCell>
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
