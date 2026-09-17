'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCan } from '@/features/session';
import { cn } from '@/lib/utils';
import { rollbackLocationMutation } from '../../api/mutations';
import { locationVersionsQueryOptions } from '../../api/queries';

/** S-LOC-03 «История»: version timeline with rollback (SDD-02 §4 LocationVersion). */
export function HistoryTab({
  locationId,
  currentVersion
}: {
  locationId: string;
  currentVersion: number;
}) {
  const t = useTranslations('locations.detail.history');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const canEdit = useCan('locations.edit');
  const { data, isPending } = useQuery(locationVersionsQueryOptions(locationId));
  const [confirmVersion, setConfirmVersion] = useState<number | null>(null);
  const rollback = useMutation({
    ...rollbackLocationMutation(queryClient, locationId),
    onSuccess: () => {
      toast.success(t('rolledBack'));
      setConfirmVersion(null);
      void queryClient.invalidateQueries({
        queryKey: locationVersionsQueryOptions(locationId).queryKey
      });
    },
    onError: (e) => toast.error(e.message)
  });

  if (isPending)
    return (
      <div className='flex flex-col gap-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-16' />
        ))}
      </div>
    );
  const items = data?.items ?? [];
  if (!items.length)
    return <p className='text-muted-foreground py-8 text-center text-sm'>{t('empty')}</p>;

  return (
    <>
      <AlertModal
        isOpen={confirmVersion !== null}
        onClose={() => setConfirmVersion(null)}
        onConfirm={() => confirmVersion !== null && rollback.mutate(confirmVersion)}
        loading={rollback.isPending}
        description={t('rollbackConfirm', { version: confirmVersion ?? 0 })}
      />
      <ol className='relative flex flex-col gap-4 border-l pl-6'>
        {items.map((v) => {
          const current = v.version === currentVersion;
          const AuthorIcon =
            v.author.kind === 'user'
              ? Icons.user
              : v.author.kind === 'platform'
                ? Icons.sources
                : Icons.settings;
          return (
            <li key={v.version} className='relative'>
              <span
                className={cn(
                  'bg-background absolute -left-[31px] top-1 flex size-5 items-center justify-center rounded-full border',
                  current && 'border-primary'
                )}
              >
                <AuthorIcon className='size-3' />
              </span>
              <div className='flex flex-wrap items-center gap-2 text-sm'>
                <span className='font-medium'>{t('version', { version: v.version })}</span>
                {current && <Badge variant='secondary'>{t('current')}</Badge>}
                <span className='text-muted-foreground'>
                  {format.dateTime(new Date(v.created_at), 'long')}
                </span>
                <span className='text-muted-foreground'>
                  · {t(`by.${v.author.kind}`)}
                  {v.author.name ? `: ${v.author.name}` : ''}
                </span>
                {canEdit && !current && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='ml-auto h-7 text-xs'
                    onClick={() => setConfirmVersion(v.version)}
                  >
                    <Icons.history className='size-3.5' /> {t('rollback')}
                  </Button>
                )}
              </div>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {t('fields', {
                  fields: v.changed_fields.includes('*') ? t('all') : v.changed_fields.join(', ')
                })}
              </p>
            </li>
          );
        })}
      </ol>
    </>
  );
}
