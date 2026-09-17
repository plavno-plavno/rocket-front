'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
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
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <ol className='lp-sync-flow' aria-label={t('flow.label')}>
          {(['company', 'review', 'platforms'] as const).map((step, index) => {
            const Icon = [Icons.locations, Icons.eye, Icons.sources][index];
            return (
              <li key={step}>
                <Icon className='size-6 shrink-0' aria-hidden />
                <div>
                  <span className='text-muted-foreground text-xs'>{index + 1} / 3</span>
                  <p className='font-medium'>{t(`flow.${step}`)}</p>
                </div>
                {index < 2 && (
                  <Icons.arrowRight
                    className='absolute top-1 right-0 hidden size-4 opacity-50 sm:block'
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
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
                  <table className='w-full table-fixed text-sm'>
                    <thead className='text-muted-foreground'>
                      <tr>
                        <th className='px-2 py-3 text-left font-medium'>{t('field')}</th>
                        <th className='px-2 py-3 text-left font-medium'>{t('from')}</th>
                        <th className='px-2 py-3 text-left font-medium'>{t('to')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {l.changes.map((c) => (
                        <tr key={c.field} className='border-t'>
                          <td className='px-2 py-3 align-top text-xs break-words'>{c.field}</td>
                          <td className='text-muted-foreground px-2 py-3 align-top break-words line-through'>
                            {fmt(c.from)}
                          </td>
                          <td className='px-2 py-3 align-top break-words'>
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
