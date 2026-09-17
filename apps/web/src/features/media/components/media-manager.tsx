'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useState } from 'react';
import { toast } from 'sonner';
import { FileUploader } from '@/components/file-uploader';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { LocationPicker, locationsQueryOptions } from '@/features/locations';
import { useCan } from '@/features/session';
import { platformsQueryOptions } from '@/features/sources';
import { useScope } from '@/hooks/use-scope';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  actOnListingMediaMutation,
  deleteMediaAssetMutation,
  uploadMediaAssetMutation
} from '../api/mutations';
import { listingMediaQueryOptions, mediaAssetsQueryOptions } from '../api/queries';
import type { ListingMedia, MediaAsset } from '../api/types';

const ALL = '__all__';
const KINDS: MediaAsset['kind'][] = ['photo', 'logo', 'cover', 'video'];
const ORIGINS: ListingMedia['origin'][] = ['owner', 'user_generated'];
const STATES: ListingMedia['state'][] = ['published', 'pending', 'rejected', 'flagged'];

const STATE_TONE: Record<ListingMedia['state'], string> = {
  published: 'text-status-synced',
  pending: 'text-status-sent',
  rejected: 'text-status-error',
  flagged: 'text-status-action'
};

const params = {
  tab: parseAsStringLiteral(['library', 'listings'] as const).withDefault('library'),
  kind: parseAsString.withDefault(''),
  platform: parseAsString.withDefault(''),
  origin: parseAsString.withDefault(''),
  state: parseAsString.withDefault(''),
  location: parseAsString.withDefault('')
};

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function UploadDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const t = useTranslations('media.upload');
  const tk = useTranslations('media.kinds');
  const queryClient = useQueryClient();
  const upload = useMutation(uploadMediaAssetMutation(queryClient));
  const [files, setFiles] = useState<File[]>([]);
  const [kind, setKind] = useState<MediaAsset['kind']>('photo');
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const submit = async () => {
    if (files.length === 0) return;
    try {
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        form.append('kind', kind);
        form.append('location_ids', locationIds.join(','));
        setProgress((p) => ({ ...p, [file.name]: 50 }));
        await upload.mutateAsync({ form });
        setProgress((p) => ({ ...p, [file.name]: 100 }));
      }
      toast.success(t('done', { count: files.length }));
      setFiles([]);
      setProgress({});
      onOpenChange(false);
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg' data-testid='media-upload-dialog'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <FileUploader
            value={files}
            onValueChange={setFiles}
            accept={{ 'image/*': [] }}
            maxFiles={10}
            multiple
            maxSize={8 * 1024 * 1024}
            progresses={progress}
          />
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='media-kind'>{t('kind')}</FieldLabel>
              <Select
                value={kind}
                onValueChange={(v) => setKind((v as MediaAsset['kind']) ?? 'photo')}
              >
                <SelectTrigger id='media-kind' aria-label={t('kind')}>
                  <SelectValue>{(v: string) => tk(v as MediaAsset['kind'])}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {KINDS.filter((k) => k !== 'video').map((k) => (
                    <SelectItem key={k} value={k}>
                      {tk(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>{t('locations')}</FieldLabel>
              <div className='flex items-center gap-2 text-sm'>
                <span>
                  {locationIds.length === 0
                    ? t('locationsAll')
                    : t('locationsSelected', { count: locationIds.length })}
                </span>
                <LocationPicker
                  value={{ location_ids: locationIds, group_ids: [] }}
                  onChange={(v) => setLocationIds(v.location_ids)}
                />
              </div>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={submit}
            disabled={files.length === 0 || upload.isPending}
            data-testid='media-upload-submit'
          >
            {upload.isPending && <Icons.spinner className='size-4 animate-spin' />}
            {t('submit', { count: files.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FlagDialog({ item, onClose }: { item: ListingMedia | null; onClose: () => void }) {
  const t = useTranslations('media.flag');
  const queryClient = useQueryClient();
  const act = useMutation(actOnListingMediaMutation(queryClient));
  const [reason, setReason] = useState('');
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid='media-flag-dialog'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor='flag-reason'>{t('reason')}</FieldLabel>
          <Textarea
            id='flag-reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t('reasonPlaceholder')}
          />
        </Field>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            disabled={act.isPending || !reason.trim()}
            onClick={() =>
              item &&
              act.mutate(
                { id: item.id, body: { action: 'flag', reason: reason.trim() } },
                {
                  onSuccess: () => {
                    toast.success(t('done'));
                    setReason('');
                    onClose();
                  },
                  onError: (e) => toast.error(errorText(e))
                }
              )
            }
            data-testid='media-flag-submit'
          >
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** S-MED-01 «Менеджер фото»: own library (upload / delete, kind filter) and photos observed on listings (own / UGC, flag / delete). */
export function MediaManager() {
  const t = useTranslations('media');
  const format = useFormatter();
  const [scope] = useScope();
  const [p, setP] = useQueryStates(params, { shallow: true });
  const canEdit = useCan('locations.edit');
  const queryClient = useQueryClient();
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data: locations } = useQuery(
    locationsQueryOptions({ scope: scope ?? 'all', page: 1, page_size: 200 })
  );
  const locationName = (id: string) => locations?.items.find((l) => l.id === id)?.name ?? id;

  const library = useQuery({
    ...mediaAssetsQueryOptions({
      page: 1,
      page_size: 100,
      ...(p.kind ? { 'filter[kind]': [p.kind as MediaAsset['kind']] } : {}),
      ...(p.location ? { 'filter[location_id]': p.location } : {})
    }),
    enabled: p.tab === 'library',
    placeholderData: (prev) => prev
  });
  const listing = useQuery({
    ...listingMediaQueryOptions({
      scope: scope ?? 'all',
      page: 1,
      page_size: 100,
      ...(p.platform ? { 'filter[platform_id]': [p.platform] } : {}),
      ...(p.origin ? { 'filter[origin]': [p.origin as ListingMedia['origin']] } : {}),
      ...(p.state ? { 'filter[state]': [p.state as ListingMedia['state']] } : {}),
      ...(p.location ? { 'filter[location_id]': p.location } : {})
    }),
    enabled: p.tab === 'listings',
    placeholderData: (prev) => prev
  });
  const removeAsset = useMutation(deleteMediaAssetMutation(queryClient));
  const act = useMutation(actOnListingMediaMutation(queryClient));
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<MediaAsset | null>(null);
  const [deletingListing, setDeletingListing] = useState<ListingMedia | null>(null);
  const [flagging, setFlagging] = useState<ListingMedia | null>(null);

  const select = (
    key: 'kind' | 'platform' | 'origin' | 'state',
    options: { value: string; label: string }[],
    label: string,
    all: string
  ) => (
    <Select value={p[key] || ALL} onValueChange={(v) => setP({ [key]: !v || v === ALL ? '' : v })}>
      <SelectTrigger
        className='h-8 min-w-40'
        aria-label={label}
        data-testid={`media-filter-${key}`}
      >
        <SelectValue>
          {(v: string) => (v === ALL ? all : (options.find((o) => o.value === v)?.label ?? v))}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{all}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className='flex flex-col gap-4' data-testid='media-manager'>
      <div className='flex flex-wrap items-center gap-2'>
        <Tabs value={p.tab} onValueChange={(v) => setP({ tab: v as typeof p.tab })}>
          <TabsList>
            <TabsTrigger value='library'>{t('tabs.library')}</TabsTrigger>
            <TabsTrigger value='listings'>{t('tabs.listings')}</TabsTrigger>
          </TabsList>
        </Tabs>
        {p.tab === 'library'
          ? select(
              'kind',
              KINDS.map((k) => ({ value: k, label: t(`kinds.${k}`) })),
              t('filters.kind'),
              t('filters.anyKind')
            )
          : [
              select(
                'platform',
                (platforms?.items ?? []).map((x) => ({ value: x.id, label: x.name })),
                t('filters.platform'),
                t('filters.anyPlatform')
              ),
              select(
                'origin',
                ORIGINS.map((o) => ({ value: o, label: t(`origins.${o}`) })),
                t('filters.origin'),
                t('filters.anyOrigin')
              ),
              select(
                'state',
                STATES.map((s) => ({ value: s, label: t(`states.${s}`) })),
                t('filters.state'),
                t('filters.anyState')
              )
            ].map((el, i) => <span key={i}>{el}</span>)}
        <LocationPicker
          mode='single'
          value={{ location_ids: p.location ? [p.location] : [], group_ids: [] }}
          onChange={(v) => setP({ location: v.location_ids[0] ?? '' })}
          trigger={
            <span
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-8 cursor-pointer'
              )}
              data-testid='media-filter-location'
            >
              <Icons.locations className='size-4' />
              {p.location ? locationName(p.location) : t('filters.anyLocation')}
            </span>
          }
        />
        {p.location && (
          <Button
            variant='ghost'
            size='sm'
            className='h-8'
            onClick={() => setP({ location: '' })}
            aria-label={t('filters.clearLocation')}
          >
            <Icons.close className='size-4' />
          </Button>
        )}
        {p.tab === 'library' && canEdit && (
          <Button
            size='sm'
            className='ml-auto'
            onClick={() => setUploadOpen(true)}
            data-testid='media-upload-open'
          >
            <Icons.upload className='size-4' /> {t('actions.upload')}
          </Button>
        )}
      </div>

      {p.tab === 'library' ? (
        library.isPending ? (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6'>
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className='aspect-[3/2]' />
            ))}
          </div>
        ) : (library.data?.items ?? []).length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icons.media />
              </EmptyMedia>
              <EmptyTitle>{t('library.empty')}</EmptyTitle>
              <EmptyDescription>{t('library.emptyHint')}</EmptyDescription>
            </EmptyHeader>
            {canEdit && <Button onClick={() => setUploadOpen(true)}>{t('actions.upload')}</Button>}
          </Empty>
        ) : (
          <ul
            className={cn(
              'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6',
              library.isPlaceholderData && 'opacity-60'
            )}
            data-testid='media-library'
          >
            {(library.data?.items ?? []).map((m) => (
              <li
                key={m.id}
                className='group bg-card relative overflow-hidden rounded-lg border'
                data-asset={m.id}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.thumbnail_url ?? m.url}
                  alt=''
                  className='aspect-[3/2] w-full object-cover'
                  loading='lazy'
                />
                <div className='flex items-center justify-between gap-2 p-2 text-xs'>
                  <Badge variant='secondary'>{t(`kinds.${m.kind}`)}</Badge>
                  <span className='text-muted-foreground tabular-nums'>
                    {m.width}×{m.height}
                    {m.size_bytes
                      ? ` · ${format.number(m.size_bytes / 1024, { maximumFractionDigits: 0 })} КБ`
                      : ''}
                  </span>
                </div>
                {(m.location_ids?.length ?? 0) > 0 && (
                  <div className='text-muted-foreground truncate px-2 pb-2 text-[11px]'>
                    {t('library.locations', { count: m.location_ids!.length })}
                  </div>
                )}
                {canEdit && (
                  <Button
                    size='icon-sm'
                    variant='secondary'
                    className='absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
                    aria-label={t('actions.delete')}
                    onClick={() => setDeletingAsset(m)}
                  >
                    <Icons.trash className='size-3.5' />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )
      ) : listing.isPending ? (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6'>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className='aspect-[3/2]' />
          ))}
        </div>
      ) : (listing.data?.items ?? []).length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.media />
            </EmptyMedia>
            <EmptyTitle>{t('listings.empty')}</EmptyTitle>
            <EmptyDescription>{t('listings.emptyHint')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul
          className={cn(
            'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6',
            listing.isPlaceholderData && 'opacity-60'
          )}
          data-testid='media-listings'
        >
          {(listing.data?.items ?? []).map((m) => (
            <li
              key={m.id}
              className='bg-card relative flex flex-col overflow-hidden rounded-lg border'
              data-listing-media={m.id}
              data-origin={m.origin}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.thumbnail_url ?? m.url}
                alt=''
                className='aspect-[3/2] w-full object-cover'
                loading='lazy'
              />
              <div className='flex flex-1 flex-col gap-1 p-2 text-xs'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='flex items-center gap-1.5'>
                    <PlatformIcon
                      platformId={m.platform_id}
                      icon={platforms?.items.find((x) => x.id === m.platform_id)?.icon ?? null}
                    />
                    <Badge variant={m.origin === 'user_generated' ? 'outline' : 'secondary'}>
                      {t(`origins.${m.origin}`)}
                    </Badge>
                  </span>
                  <span className={cn('inline-flex items-center gap-1', STATE_TONE[m.state])}>
                    <span className='size-1.5 rounded-full bg-current' aria-hidden />
                    {t(`states.${m.state}`)}
                  </span>
                </div>
                <div className='text-muted-foreground truncate'>{locationName(m.location_id)}</div>
                {m.author_name && (
                  <div className='text-muted-foreground truncate'>
                    {t('listings.by', { name: m.author_name })}
                  </div>
                )}
                <div className='text-muted-foreground'>
                  {m.observed_at && (
                    <time dateTime={m.observed_at}>
                      {format.dateTime(new Date(m.observed_at), 'short')}
                    </time>
                  )}
                </div>
                {canEdit && (
                  <div className='mt-auto flex justify-end gap-1 pt-1'>
                    {m.origin === 'user_generated' && m.state !== 'flagged' && (
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-7 px-2'
                        onClick={() => setFlagging(m)}
                      >
                        <Icons.warning className='size-3.5' /> {t('actions.flag')}
                      </Button>
                    )}
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      className='size-7'
                      aria-label={t('actions.delete')}
                      onClick={() => setDeletingListing(m)}
                    >
                      <Icons.trash className='size-3.5' />
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <FlagDialog item={flagging} onClose={() => setFlagging(null)} />
      <AlertModal
        isOpen={!!deletingAsset}
        onClose={() => setDeletingAsset(null)}
        loading={removeAsset.isPending}
        title={t('actions.delete')}
        description={t('library.deleteConfirm')}
        confirmLabel={t('actions.delete')}
        onConfirm={() =>
          deletingAsset &&
          removeAsset.mutate(
            { id: deletingAsset.id },
            {
              onSuccess: () => {
                toast.success(t('library.deleted'));
                setDeletingAsset(null);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
      <AlertModal
        isOpen={!!deletingListing}
        onClose={() => setDeletingListing(null)}
        loading={act.isPending}
        title={t('actions.delete')}
        description={t('listings.deleteConfirm')}
        confirmLabel={t('actions.delete')}
        onConfirm={() =>
          deletingListing &&
          act.mutate(
            { id: deletingListing.id, body: { action: 'delete' } },
            {
              onSuccess: () => {
                toast.success(t('listings.deleted'));
                setDeletingListing(null);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
    </div>
  );
}
