'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { retrySyncBatchMutation } from '../../api/mutations';
import { syncBatchQueryOptions } from '../../api/queries';

const FINAL = ['done', 'failed', 'partially_failed'];

/** Progress of a bulk operation (SyncBatch) — polls until a final state, offers a retry. */
export function BatchProgressDialog({
  batchId,
  onClose
}: {
  batchId: string | null;
  onClose: () => void;
}) {
  const t = useTranslations('locations.bulk.batch');
  const tApply = useTranslations('locations.import.apply');
  const queryClient = useQueryClient();
  const { data: batch } = useQuery({
    ...syncBatchQueryOptions(batchId ?? ''),
    enabled: !!batchId
  });
  const retry = useMutation(retrySyncBatchMutation(queryClient));
  const finished = !!batch && FINAL.includes(batch.state);
  const processed = batch ? batch.progress.done + batch.progress.failed : 0;
  const pct = batch ? Math.round((processed / Math.max(1, batch.progress.total)) * 100) : 0;

  return (
    <Dialog open={!!batchId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} data-testid='batch-progress'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {batch ? t('progress', { done: processed, total: batch.progress.total }) : '…'}
            {batch?.progress.failed ? ` · ${t('failed', { failed: batch.progress.failed })}` : ''}
          </DialogDescription>
        </DialogHeader>
        <Progress value={pct} aria-label={t('title')} />
        {!finished && batch && (
          <p className='text-muted-foreground text-sm' data-testid='batch-background'>
            {t('background')}
          </p>
        )}
        {finished && batch && (
          <Badge
            variant='outline'
            className={cn(
              'w-fit',
              batch.state === 'done' ? 'text-status-synced' : 'text-status-error'
            )}
          >
            {batch.state === 'done'
              ? tApply('done')
              : batch.state === 'failed'
                ? tApply('failed')
                : tApply('partial')}
          </Badge>
        )}
        <DialogFooter>
          {finished && batch?.progress.failed ? (
            <Button
              variant='outline'
              onClick={() => batchId && retry.mutate(batchId)}
              disabled={retry.isPending}
            >
              {t('retry')}
            </Button>
          ) : null}
          <Button onClick={onClose}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
