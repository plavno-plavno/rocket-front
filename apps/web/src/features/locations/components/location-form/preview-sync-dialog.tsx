'use client';

import { useTranslations } from 'next-intl';
import { PlatformIcon } from '@/components/lp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PreviewSyncResponse } from '../../api/types';

export interface PreviewSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: PreviewSyncResponse | null;
  loading: boolean;
  platformName: (id: string) => string;
  onConfirm: () => void;
  confirming: boolean;
}

const fmt = (v: unknown) => (v == null ? '—' : typeof v === 'string' ? v : JSON.stringify(v));

/** «Что уйдёт на площадки» — dry-run diff before saving (SDD-01 §8 S-LOC-03). */
export function PreviewSyncDialog({
  open,
  onOpenChange,
  preview,
  loading,
  platformName,
  onConfirm,
  confirming
}: PreviewSyncDialogProps) {
  const t = useTranslations('locations.preview');
  const listings = (preview?.listings ?? []).filter((l) => l.changes.length);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>…</p>
        ) : !preview || !preview.available ? (
          <Alert>
            <AlertDescription>{t('unavailable')}</AlertDescription>
          </Alert>
        ) : listings.length === 0 ? (
          <Alert>
            <AlertDescription>{t('noChanges')}</AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className='max-h-[50vh] pr-3'>
            <p className='text-muted-foreground mb-2 text-xs'>
              {t('listings', { count: listings.length })}
            </p>
            <div className='flex flex-col gap-3'>
              {listings.map((l) => (
                <div key={l.listing_id} className='rounded-md border p-3 text-sm'>
                  <div className='mb-2 flex items-center gap-2 font-medium'>
                    <PlatformIcon platformId={l.platform_id} className='size-4' />{' '}
                    {platformName(l.platform_id)}
                  </div>
                  <table className='w-full text-xs'>
                    <thead className='text-muted-foreground'>
                      <tr>
                        <th className='py-1 text-left font-normal'>{t('field')}</th>
                        <th className='py-1 text-left font-normal'>{t('from')}</th>
                        <th className='py-1 text-left font-normal'>{t('to')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {l.changes.map((c) => (
                        <tr key={c.field} className='border-t'>
                          <td className='py-1 pr-2 font-mono'>{c.field}</td>
                          <td className='text-muted-foreground max-w-48 truncate py-1 pr-2 line-through'>
                            {fmt(c.from)}
                          </td>
                          <td className='max-w-48 truncate py-1'>
                            {fmt(c.to)}
                            {c.note && <span className='text-status-action ml-1'>· {c.note}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {l.warnings?.length ? (
                    <p className='text-status-action mt-2 text-xs'>{l.warnings.join(' · ')}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={confirming}>
            {t('cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={loading || confirming}>
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
