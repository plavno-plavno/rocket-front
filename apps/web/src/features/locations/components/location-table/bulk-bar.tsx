'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCan } from '@/features/session';
import { useScope } from '@/hooks/use-scope';
import { isApiError } from '@/lib/api';
import { bulkUpdateLocationsMutation, exportLocationsMutation } from '../../api/mutations';
import { getExport } from '../../api/service';
import type { LocationBulkRequest, LocationListItem } from '../../api/types';
import { AssignGroupsDialog } from './assign-groups-dialog';
import { BatchProgressDialog } from './batch-progress-dialog';
import { BulkEditSheet } from './bulk-edit-sheet';

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

/** Polls an export until it is downloadable (mock finishes in ~2.5 s). */
async function waitForExport(id: string) {
  for (let i = 0; i < 40; i++) {
    const exp = await getExport(id);
    if (exp.state === 'done' && exp.download_url) return exp;
    if (exp.state === 'failed') throw new Error(exp.error ?? 'export failed');
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('timeout');
}

/**
 * Bulk bar shown when rows are selected (SCR-1, S-LOC-01): bulk edit, assign groups,
 * temporarily close, export selected. Every flow reports through a SyncBatch or an Export.
 */
export function LocationBulkBar({ table }: { table: Table<LocationListItem> }) {
  const t = useTranslations('locations.list.bulk');
  const tb = useTranslations('locations.bulk');
  const tc = useTranslations('common');
  const canEdit = useCan('locations.edit');
  const [scope] = useScope();
  const queryClient = useQueryClient();
  const rows = table.getFilteredSelectedRowModel().rows;
  const ids = rows.map((r) => r.original.id);
  const allClosed =
    rows.length > 0 && rows.every((r) => r.original.status === 'temporarily_closed');

  const [editOpen, setEditOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);

  const bulk = useMutation(bulkUpdateLocationsMutation(queryClient, scope ?? 'all'));
  const exp = useMutation(exportLocationsMutation(scope ?? 'all'));

  const toggleClosed = async () => {
    try {
      const batch = await bulk.mutateAsync({
        location_ids: ids,
        patch: { status: allClosed ? 'open' : 'temporarily_closed' } as LocationBulkRequest['patch']
      });
      setCloseOpen(false);
      setBatchId(batch.id);
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const exportSelected = async () => {
    const id = toast.loading(tb('export.done'));
    try {
      const started = await exp.mutateAsync({ format: 'xlsx', filters: { location_ids: ids } });
      const done = await waitForExport(started.id);
      toast.success(tc('exportReady'), {
        id,
        duration: 15_000,
        action: { label: tc('download'), onClick: () => window.open(done.download_url!, '_blank') }
      });
    } catch (e) {
      toast.error(errorText(e), { id });
    }
  };

  return (
    <div
      className='bg-background/95 fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur'
      role='toolbar'
      aria-label={tc('actions')}
      data-testid='bulk-bar'
    >
      <span className='text-sm font-medium'>{tc('selected', { count: rows.length })}</span>
      <Separator orientation='vertical' className='h-5' />
      {canEdit && (
        <>
          <Button size='sm' variant='outline' onClick={() => setEditOpen(true)}>
            <Icons.edit className='size-4' /> {t('edit')}
          </Button>
          <Button size='sm' variant='outline' onClick={() => setGroupsOpen(true)}>
            <Icons.locations className='size-4' /> {t('assignGroups')}
          </Button>
          <Button size='sm' variant='outline' onClick={() => setCloseOpen(true)}>
            <Icons.circleDashed className='size-4' /> {allClosed ? tb('close.reopen') : t('close')}
          </Button>
        </>
      )}
      <Button size='sm' variant='outline' onClick={exportSelected} disabled={exp.isPending}>
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

      {canEdit && (
        <>
          <BulkEditSheet
            open={editOpen}
            onOpenChange={setEditOpen}
            locationIds={ids}
            scope={scope ?? 'all'}
            onStarted={setBatchId}
          />
          <AssignGroupsDialog
            open={groupsOpen}
            onOpenChange={setGroupsOpen}
            locationIds={ids}
            onDone={() => table.resetRowSelection()}
          />
          <AlertModal
            isOpen={closeOpen}
            onClose={() => setCloseOpen(false)}
            onConfirm={toggleClosed}
            loading={bulk.isPending}
            title={allClosed ? tb('close.reopen') : tb('close.title')}
            description={tb('close.description', { count: rows.length })}
            confirmLabel={allClosed ? tb('close.reopen') : tb('close.submit')}
          />
          <BatchProgressDialog
            batchId={batchId}
            onClose={() => {
              setBatchId(null);
              table.resetRowSelection();
            }}
          />
        </>
      )}
    </div>
  );
}
