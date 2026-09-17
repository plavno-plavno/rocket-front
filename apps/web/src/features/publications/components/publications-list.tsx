'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { parseAsString, useQueryStates } from 'nuqs';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/features/session';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { deletePublicationMutation, retryPublicationMutation } from '../api/mutations';
import { publicationQueryOptions, publicationsQueryOptions } from '../api/queries';
import type { Publication } from '../api/types';
import { PublicationComposer } from './publication-composer';

const STATES: Publication['state'][] = [
  'draft',
  'scheduled',
  'publishing',
  'published',
  'partially_failed',
  'failed'
];
const TYPES: Publication['type'][] = ['news', 'offer', 'event'];
const ALL = '__all__';

const STATE_TONE: Record<Publication['state'], string> = {
  draft: 'text-muted-foreground',
  scheduled: 'text-status-sent',
  publishing: 'text-status-sent',
  published: 'text-status-synced',
  partially_failed: 'text-status-action',
  failed: 'text-status-error'
};
const RESULT_TONE: Record<Publication['results'][number]['state'], string> = {
  queued: 'text-muted-foreground',
  sent: 'text-status-sent',
  published: 'text-status-synced',
  rejected: 'text-status-action',
  failed: 'text-status-error'
};

const params = {
  state: parseAsString.withDefault(''),
  type: parseAsString.withDefault(''),
  q: parseAsString.withDefault(''),
  publication: parseAsString.withDefault('')
};

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function ResultSummary({ results }: { results: Publication['results'] }) {
  const t = useTranslations('publications.results');
  const count = (s: Publication['results'][number]['state']) =>
    results.filter((r) => r.state === s).length;
  if (results.length === 0) return <span className='text-muted-foreground text-xs'>—</span>;
  return (
    <span className='flex flex-wrap gap-2 text-xs tabular-nums'>
      <span className='text-status-synced'>{t('published', { count: count('published') })}</span>
      {count('rejected') + count('failed') > 0 && (
        <span className='text-status-error'>
          {t('failed', { count: count('rejected') + count('failed') })}
        </span>
      )}
      {count('queued') + count('sent') > 0 && (
        <span className='text-status-sent'>
          {t('pending', { count: count('queued') + count('sent') })}
        </span>
      )}
    </span>
  );
}

/** Detail sheet: per-listing results, «Повторить неуспешные», edit (draft / scheduled), delete. */
function PublicationSheet({
  id,
  onClose,
  onEdit,
  canEdit
}: {
  id: string | null;
  onClose: () => void;
  onEdit: (p: Publication) => void;
  canEdit: boolean;
}) {
  const t = useTranslations('publications.sheet');
  const ts = useTranslations('publications.states');
  const tr = useTranslations('publications.resultStates');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    ...publicationQueryOptions(id ?? ''),
    enabled: !!id,
    refetchInterval: (q) => (q.state.data?.state === 'publishing' ? 1000 : false)
  });
  const { data: platforms } = useQuery(platformsQueryOptions());
  const retry = useMutation(retryPublicationMutation(queryClient));
  const remove = useMutation(deletePublicationMutation(queryClient));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const failed = (data?.results ?? []).filter(
    (r) => r.state === 'failed' || r.state === 'rejected'
  );

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className='flex w-full flex-col gap-0 p-0 sm:max-w-2xl'
        data-testid='publication-sheet'
      >
        <SheetHeader className='border-b'>
          <SheetTitle className='flex flex-wrap items-center gap-2'>
            {data?.title ?? t('untitled')}
            {data && (
              <Badge variant='outline' className={cn('gap-1', STATE_TONE[data.state])}>
                <span className='size-1.5 rounded-full bg-current' aria-hidden />
                {ts(data.state)}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {data &&
              (data.schedule_at && data.state === 'scheduled'
                ? t('scheduledFor', { date: format.dateTime(new Date(data.schedule_at), 'long') })
                : t('createdAt', { date: format.dateTime(new Date(data.created_at), 'long') }))}
          </SheetDescription>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-4'>
          {isPending || !data ? (
            <Skeleton className='h-64' />
          ) : (
            <>
              <p className='text-sm whitespace-pre-wrap'>{data.text}</p>
              <div className='flex flex-wrap items-center gap-2 text-sm'>
                {data.platform_ids.map((pid) => (
                  <Badge key={pid} variant='outline' className='gap-1'>
                    <PlatformIcon
                      platformId={pid}
                      icon={platforms?.items.find((p) => p.id === pid)?.icon ?? null}
                    />
                    {platforms?.items.find((p) => p.id === pid)?.name ?? pid}
                  </Badge>
                ))}
                <span className='text-muted-foreground text-xs'>
                  {t('locations', { count: data.location_ids?.length ?? 0 })}
                </span>
              </div>
              {data.results.length > 0 && (
                <div className='overflow-hidden rounded-lg border'>
                  <Table data-testid='publication-results'>
                    <TableHeader className='bg-muted'>
                      <TableRow>
                        <TableHead>{t('platform')}</TableHead>
                        <TableHead>{t('listing')}</TableHead>
                        <TableHead>{t('state')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.results.slice(0, 60).map((r) => (
                        <TableRow key={`${r.listing_id}-${r.platform_id}`}>
                          <TableCell>
                            <span className='flex items-center gap-2'>
                              <PlatformIcon
                                platformId={r.platform_id}
                                icon={
                                  platforms?.items.find((p) => p.id === r.platform_id)?.icon ?? null
                                }
                              />
                              {platforms?.items.find((p) => p.id === r.platform_id)?.name ??
                                r.platform_id}
                            </span>
                          </TableCell>
                          <TableCell className='font-mono text-xs'>{r.listing_id}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 text-xs',
                                RESULT_TONE[r.state]
                              )}
                            >
                              <span className='size-1.5 rounded-full bg-current' aria-hidden />
                              {tr(r.state)}
                              {r.error && (
                                <span className='text-muted-foreground'>· {r.error}</span>
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {data.results.length > 60 && (
                    <p className='text-muted-foreground p-2 text-center text-xs'>
                      {t('more', { count: data.results.length - 60 })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        {data && canEdit && (
          <SheetFooter className='flex-row flex-wrap justify-end gap-2 border-t'>
            <Button variant='ghost' onClick={() => setConfirmDelete(true)}>
              <Icons.trash className='size-4' /> {t('delete')}
            </Button>
            {(data.state === 'draft' || data.state === 'scheduled') && (
              <Button variant='outline' onClick={() => onEdit(data)} data-testid='publication-edit'>
                <Icons.edit className='size-4' /> {t('edit')}
              </Button>
            )}
            {failed.length > 0 && (
              <Button
                disabled={retry.isPending}
                onClick={() =>
                  retry.mutate(
                    { id: data.id },
                    {
                      onSuccess: () => toast.success(t('retried')),
                      onError: (e) => toast.error(errorText(e))
                    }
                  )
                }
                data-testid='publication-retry'
              >
                {retry.isPending ? (
                  <Icons.spinner className='size-4 animate-spin' />
                ) : (
                  <Icons.refresh className='size-4' />
                )}
                {t('retry', { count: failed.length })}
              </Button>
            )}
          </SheetFooter>
        )}
        <AlertModal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          loading={remove.isPending}
          title={t('delete')}
          description={t('deleteConfirm')}
          confirmLabel={t('delete')}
          onConfirm={() =>
            data &&
            remove.mutate(
              { id: data.id },
              {
                onSuccess: () => {
                  toast.success(t('deleted'));
                  setConfirmDelete(false);
                  onClose();
                },
                onError: (e) => toast.error(errorText(e))
              }
            )
          }
        />
      </SheetContent>
    </Sheet>
  );
}

/** S-PUB-01 «Публикации»: state tabs, type filter, search, table with platforms / scope / results, composer + detail sheet. */
export function PublicationsList() {
  const t = useTranslations('publications');
  const format = useFormatter();
  const [p, setP] = useQueryStates(params, { shallow: true });
  const canEdit = useCan('publications.edit');
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data, isPending, isPlaceholderData } = useQuery({
    ...publicationsQueryOptions({
      page: 1,
      page_size: 100,
      ...(p.q ? { q: p.q } : {}),
      ...(p.state ? { 'filter[state]': [p.state as Publication['state']] } : {}),
      ...(p.type ? { 'filter[type]': [p.type as Publication['type']] } : {})
    }),
    placeholderData: (prev) => prev,
    refetchInterval: (q) =>
      q.state.data?.items.some((x) => x.state === 'publishing') ? 1500 : false
  });
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Publication | null>(null);
  const items = data?.items ?? [];

  return (
    <div className='flex flex-col gap-4' data-testid='publications-list'>
      <div className='flex flex-wrap items-center gap-2'>
        <Tabs value={p.state || ALL} onValueChange={(v) => setP({ state: v === ALL ? '' : v })}>
          <TabsList>
            <TabsTrigger value={ALL}>{t('tabs.all')}</TabsTrigger>
            {STATES.filter((s) => s !== 'publishing').map((s) => (
              <TabsTrigger key={s} value={s}>
                {t(`states.${s}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className='relative min-w-56 flex-1'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={p.q}
            onChange={(e) => setP({ q: e.target.value })}
            placeholder={t('search')}
            className='h-8 pl-8'
            aria-label={t('search')}
          />
        </div>
        <Select
          value={p.type || ALL}
          onValueChange={(v) => setP({ type: !v || v === ALL ? '' : v })}
        >
          <SelectTrigger className='h-8 w-40' aria-label={t('filters.type')}>
            <SelectValue>
              {(v: string) =>
                v === ALL ? t('filters.anyType') : t(`types.${v as Publication['type']}`)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('filters.anyType')}</SelectItem>
            {TYPES.map((x) => (
              <SelectItem key={x} value={x}>
                {t(`types.${x}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <Button
            size='sm'
            onClick={() => {
              setEditing(null);
              setComposerOpen(true);
            }}
            data-testid='publication-create'
          >
            <Icons.add className='size-4' /> {t('actions.create')}
          </Button>
        )}
      </div>

      <div className={cn('overflow-x-auto rounded-lg border', isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>{t('columns.publication')}</TableHead>
              <TableHead>{t('columns.platforms')}</TableHead>
              <TableHead className='text-right'>{t('columns.locations')}</TableHead>
              <TableHead>{t('columns.state')}</TableHead>
              <TableHead>{t('columns.results')}</TableHead>
              <TableHead>{t('columns.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Empty className='py-8'>
                    <EmptyHeader>
                      <EmptyMedia variant='icon'>
                        <Icons.post />
                      </EmptyMedia>
                      <EmptyTitle>
                        {p.q || p.state || p.type ? t('emptyFiltered') : t('empty')}
                      </EmptyTitle>
                      <EmptyDescription>{t('emptyHint')}</EmptyDescription>
                    </EmptyHeader>
                    {canEdit && !p.q && !p.state && !p.type && (
                      <Button onClick={() => setComposerOpen(true)}>{t('actions.create')}</Button>
                    )}
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {items.map((x) => (
              <TableRow
                key={x.id}
                data-publication={x.id}
                data-state={x.state}
                className='cursor-pointer'
                onClick={() => setP({ publication: x.id })}
              >
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Badge variant='secondary' className='shrink-0'>
                      {t(`types.${x.type}`)}
                    </Badge>
                    <div className='min-w-0'>
                      <div className='truncate font-medium'>{x.title ?? t('sheet.untitled')}</div>
                      <div className='text-muted-foreground max-w-72 truncate text-xs'>
                        {x.text}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className='flex items-center gap-1'>
                    {x.platform_ids.map((pid) => (
                      <PlatformIcon
                        key={pid}
                        platformId={pid}
                        icon={platforms?.items.find((pl) => pl.id === pid)?.icon ?? null}
                        title={platforms?.items.find((pl) => pl.id === pid)?.name}
                      />
                    ))}
                  </span>
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {x.scope === 'all' && !x.location_ids?.length
                    ? t('scopeAll')
                    : (x.location_ids?.length ?? 0)}
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className={cn('gap-1', STATE_TONE[x.state])}>
                    {x.state === 'publishing' ? (
                      <Icons.spinner className='size-3 animate-spin' />
                    ) : (
                      <span className='size-1.5 rounded-full bg-current' aria-hidden />
                    )}
                    {t(`states.${x.state}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ResultSummary results={x.results} />
                </TableCell>
                <TableCell className='text-muted-foreground text-xs'>
                  <time dateTime={x.schedule_at ?? x.created_at}>
                    {format.dateTime(new Date(x.schedule_at ?? x.created_at), 'short')}
                  </time>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PublicationComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        publication={editing}
      />
      <PublicationSheet
        id={p.publication || null}
        onClose={() => setP({ publication: '' })}
        canEdit={canEdit}
        onEdit={(pub) => {
          setEditing(pub);
          setP({ publication: '' });
          setComposerOpen(true);
        }}
      />
    </div>
  );
}
