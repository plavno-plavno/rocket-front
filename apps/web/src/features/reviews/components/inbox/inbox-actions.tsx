'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCan } from '@/features/session';
import { isApiError } from '@/lib/api';
import { exportReviewsMutation } from '../../api/mutations';
import { getExport } from '../../api/service';
import { reviewsSearchParams, SORTS, toReviewsQuery } from '../../searchparams';
import { ManualReviewDialog } from './manual-review-dialog';
import { ReviewFiltersSheet } from './review-filters';

async function waitForExport(id: string) {
  for (let i = 0; i < 40; i++) {
    const exp = await getExport(id);
    if (exp.state === 'done' && exp.download_url) return exp;
    if (exp.state === 'failed') throw new Error(exp.error ?? 'export failed');
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('timeout');
}

/** Header of the inbox: «Добавить отзыв», export, sort, filters (narrow), hotkeys help. */
export function InboxActions() {
  const t = useTranslations('reviews.actions');
  const ts = useTranslations('reviews.sort');
  const th = useTranslations('reviews.hotkeys');
  const tc = useTranslations('common');
  const canReply = useCan('reviews.reply');
  const queryClient = useQueryClient();
  const [params, setParams] = useQueryStates(reviewsSearchParams, { shallow: true });
  const [manualOpen, setManualOpen] = useState(false);
  const exp = useMutation(exportReviewsMutation(queryClient));

  const exportAll = async () => {
    const id = toast.loading(t('exportStarted'));
    try {
      const q = toReviewsQuery(params);
      const { scope, sort, q: search, ...filters } = q;
      void sort;
      const started = await exp.mutateAsync({
        body: { format: 'xlsx', filters: { ...filters, q: search } },
        params: { scope }
      });
      const done = await waitForExport(started.id);
      toast.success(t('exportReady'), {
        id,
        duration: 15_000,
        action: { label: tc('download'), onClick: () => window.open(done.download_url!, '_blank') }
      });
    } catch (e) {
      toast.error(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message, { id });
    }
  };

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <ReviewFiltersSheet />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant='outline' size='sm' />}>
          <Icons.adjustments className='size-4' /> {t('sort')}
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t('sort')}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={params.sort}
              onValueChange={(v) => void setParams({ sort: v as (typeof SORTS)[number] })}
            >
              {SORTS.map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  {ts(s)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant='outline' size='sm' onClick={exportAll} disabled={exp.isPending}>
        <Icons.download className='size-4' /> {t('export')}
      </Button>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={th('title')}
              className='hidden md:inline-flex'
            />
          }
        >
          <Icons.help className='size-4' />
        </PopoverTrigger>
        <PopoverContent className='w-56 text-sm' align='end'>
          <p className='mb-2 font-medium'>{th('title')}</p>
          <dl className='grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5'>
            <dt>
              <KbdGroup>
                <Kbd>J</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </dt>
            <dd className='text-muted-foreground'>
              {th('next')} / {th('prev')}
            </dd>
            <dt>
              <Kbd>R</Kbd>
            </dt>
            <dd className='text-muted-foreground'>{th('reply')}</dd>
            <dt>
              <Kbd>T</Kbd>
            </dt>
            <dd className='text-muted-foreground'>{th('tags')}</dd>
            <dt>
              <Kbd>A</Kbd>
            </dt>
            <dd className='text-muted-foreground'>{th('assign')}</dd>
          </dl>
        </PopoverContent>
      </Popover>
      {canReply && (
        <>
          <Button size='sm' onClick={() => setManualOpen(true)}>
            <Icons.add className='size-4' /> {t('manual')}
          </Button>
          <ManualReviewDialog
            open={manualOpen}
            onOpenChange={setManualOpen}
            onCreated={(id) => void setParams({ review: id })}
          />
        </>
      )}
    </div>
  );
}
