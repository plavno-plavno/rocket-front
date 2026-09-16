'use client';

import type { Table } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCan } from '@/features/session';
import type { LocationListItem } from '../../api/types';

/**
 * Bulk bar shown when rows are selected (SCR-1). Actions open Sheet/Dialog flows owned by UI-F1;
 * Foundation ships the bar with the export + count and disabled placeholders for the rest.
 */
export function LocationBulkBar({ table }: { table: Table<LocationListItem> }) {
  const t = useTranslations('locations.list.bulk');
  const tc = useTranslations('common');
  const canEdit = useCan('locations.edit');
  const selected = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div
      className='bg-background/95 fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur'
      role='toolbar'
      aria-label={tc('actions')}
    >
      <span className='text-sm font-medium'>{tc('selected', { count: selected })}</span>
      <Separator orientation='vertical' className='h-5' />
      {canEdit && (
        <>
          <Button size='sm' variant='outline' disabled title={tc('comingSoon')}>
            <Icons.edit className='size-4' /> {t('edit')}
          </Button>
          <Button size='sm' variant='outline' disabled title={tc('comingSoon')}>
            <Icons.locations className='size-4' /> {t('assignGroups')}
          </Button>
          <Button size='sm' variant='outline' disabled title={tc('comingSoon')}>
            <Icons.circleDashed className='size-4' /> {t('close')}
          </Button>
        </>
      )}
      <Button size='sm' variant='outline' disabled title={tc('comingSoon')}>
        <Icons.download className='size-4' /> {t('export')}
      </Button>
      <Button
        size='sm'
        variant='ghost'
        onClick={() => table.resetRowSelection()}
        aria-label={tc('clear')}
      >
        <Icons.close className='size-4' />
      </Button>
    </div>
  );
}
