'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { LocationPicker, locationsQueryOptions } from '@/features/locations';
import { useCan } from '@/features/session';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  createReviewCampaignMutation,
  deleteReviewCampaignMutation,
  sendCampaignBatchMutation,
  updateReviewCampaignMutation
} from '../api/mutations';
import { reviewCampaignsQueryOptions } from '../api/queries';
import type { Campaign, CampaignUpsert } from '../api/types';

const CHANNELS: Campaign['channel'][] = ['qr', 'sms', 'whatsapp', 'email', 'link'];
const STATUSES: Campaign['status'][] = ['draft', 'active', 'paused', 'archived'];
const ROUTINGS: Campaign['routing'][] = ['all_to_platforms', 'platforms_plus_private'];
const ALL = '__all__';

const CHANNEL_ICON: Record<Campaign['channel'], keyof typeof Icons> = {
  qr: 'code',
  sms: 'mobile',
  whatsapp: 'chat',
  email: 'mail',
  link: 'externalLink'
};
const STATUS_TONE: Record<Campaign['status'], string> = {
  draft: 'text-muted-foreground',
  active: 'text-status-synced',
  paused: 'text-status-action',
  archived: 'text-muted-foreground'
};

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

const params = {
  channel: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  q: parseAsString.withDefault('')
};

/** Sheet editor of a campaign: channel, message template, platforms, routing (no rating gating), scope, status. */
function CampaignSheet({
  open,
  onOpenChange,
  campaign
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign: Campaign | null;
}) {
  const t = useTranslations('review-generation.sheet');
  const tc = useTranslations('review-generation.channels');
  const queryClient = useQueryClient();
  const { data: platforms } = useQuery({ ...platformsQueryOptions(), enabled: open });
  const create = useMutation(createReviewCampaignMutation(queryClient));
  const update = useMutation(updateReviewCampaignMutation(queryClient));
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Campaign['channel']>('qr');
  const [template, setTemplate] = useState('');
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [routing, setRouting] = useState<Campaign['routing']>('all_to_platforms');
  const [privateForm, setPrivateForm] = useState(false);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [status, setStatus] = useState<Campaign['status']>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(campaign?.name ?? '');
    setChannel(campaign?.channel ?? 'qr');
    setTemplate(campaign?.message_template ?? t('templateDefault'));
    setPlatformIds(campaign?.target_platform_ids ?? []);
    setRouting(campaign?.routing ?? 'all_to_platforms');
    setPrivateForm(campaign?.private_form_enabled ?? false);
    const scope = campaign?.scope ?? 'all';
    setGroupIds(scope !== 'all' && scope.startsWith('grp_') ? scope.split(',') : []);
    setLocationIds(campaign?.location_ids ?? []);
    setStatus(campaign?.status ?? 'active');
    setError(null);
  }, [open, campaign, t]);

  const reviewPlatforms = (platforms?.items ?? []).filter(
    (p) => p.capabilities.reviews?.reply !== undefined
  );
  const pending = create.isPending || update.isPending;
  const submit = async () => {
    if (!name.trim()) return setError(t('nameRequired'));
    if (!template.trim()) return setError(t('templateRequired'));
    if (platformIds.length === 0) return setError(t('platformsRequired'));
    const body: CampaignUpsert = {
      name: name.trim(),
      channel,
      scope: groupIds.length ? groupIds.join(',') : 'all',
      location_ids: locationIds,
      message_template: template.trim(),
      target_platform_ids: platformIds,
      routing,
      private_form_enabled: routing === 'platforms_plus_private' && privateForm,
      status
    };
    try {
      if (campaign) await update.mutateAsync({ id: campaign.id, body });
      else await create.mutateAsync({ body });
      toast.success(campaign ? t('updated') : t('created'));
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='flex w-full flex-col gap-0 p-0 sm:max-w-xl'
        data-testid='campaign-sheet'
      >
        <SheetHeader className='border-b'>
          <SheetTitle>{campaign ? t('editTitle') : t('createTitle')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-4'>
          <Field>
            <FieldLabel htmlFor='cmp-name'>{t('name')} *</FieldLabel>
            <Input id='cmp-name' value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='cmp-channel'>{t('channel')}</FieldLabel>
              <Select
                value={channel}
                onValueChange={(v) => setChannel((v as Campaign['channel']) ?? 'qr')}
              >
                <SelectTrigger id='cmp-channel' aria-label={t('channel')}>
                  <SelectValue>{(v: string) => tc(v as Campaign['channel'])}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {tc(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor='cmp-status'>{t('status')}</FieldLabel>
              <Select
                value={status}
                onValueChange={(v) => setStatus((v as Campaign['status']) ?? 'draft')}
              >
                <SelectTrigger id='cmp-status' aria-label={t('status')}>
                  <SelectValue>
                    {(v: string) => t(`statuses.${v as Campaign['status']}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`statuses.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor='cmp-template'>{t('template')} *</FieldLabel>
            <Textarea
              id='cmp-template'
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={3}
            />
            <FieldDescription>{t('templateHint')}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>{t('platforms')} *</FieldLabel>
            <div className='grid gap-2 sm:grid-cols-2' data-testid='campaign-platforms'>
              {reviewPlatforms.map((p) => (
                <Label key={p.id} className='flex items-center gap-2 font-normal'>
                  <Checkbox
                    checked={platformIds.includes(p.id)}
                    onCheckedChange={(v) =>
                      setPlatformIds(
                        v ? [...platformIds, p.id] : platformIds.filter((x) => x !== p.id)
                      )
                    }
                  />
                  <PlatformIcon platformId={p.id} icon={p.icon} />
                  {p.name}
                </Label>
              ))}
            </div>
            <FieldDescription>{t('platformsHint')}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>{t('routing')}</FieldLabel>
            <RadioGroup
              value={routing}
              onValueChange={(v) => setRouting((v as Campaign['routing']) ?? 'all_to_platforms')}
              className='flex flex-col gap-2'
            >
              {ROUTINGS.map((r) => (
                <Label key={r} className='flex items-start gap-3 font-normal'>
                  <RadioGroupItem value={r} className='mt-0.5' />
                  <span className='flex flex-col'>
                    <span className='font-medium'>{t(`routings.${r}.title`)}</span>
                    <span className='text-muted-foreground text-xs'>{t(`routings.${r}.hint`)}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
            <Alert>
              <Icons.info className='size-4' />
              <AlertDescription>{t('noGating')}</AlertDescription>
            </Alert>
          </Field>
          {routing === 'platforms_plus_private' && (
            <div className='flex items-center justify-between rounded-md border p-3'>
              <Label htmlFor='cmp-private'>{t('privateForm')}</Label>
              <Switch id='cmp-private' checked={privateForm} onCheckedChange={setPrivateForm} />
            </div>
          )}
          <Field>
            <FieldLabel>{t('scope')}</FieldLabel>
            <div className='flex flex-wrap items-center gap-3 text-sm'>
              <span>
                {groupIds.length + locationIds.length === 0
                  ? t('scopeAll')
                  : t('scopeSelected', { count: groupIds.length + locationIds.length })}
              </span>
              <LocationPicker
                value={{ location_ids: locationIds, group_ids: groupIds }}
                onChange={(v) => {
                  setLocationIds(v.location_ids);
                  setGroupIds(v.group_ids);
                }}
                allowGroups
              />
            </div>
          </Field>
          {error && <FieldError>{error}</FieldError>}
        </div>
        <SheetFooter className='flex-row justify-end gap-2 border-t'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending} data-testid='campaign-submit'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {t('save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** «Отправить запросы»: a location + one contact per line → `POST /review-campaigns/{id}/send`. */
function SendDialog({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const t = useTranslations('review-generation.send');
  const queryClient = useQueryClient();
  const send = useMutation(sendCampaignBatchMutation(queryClient));
  const { data: locations } = useQuery({
    ...locationsQueryOptions({ scope: 'all', page: 1, page_size: 200 }),
    enabled: !!campaign
  });
  const [locationId, setLocationId] = useState('');
  const [contacts, setContacts] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (campaign) {
      setLocationId('');
      setContacts('');
      setError(null);
    }
  }, [campaign]);
  const list = contacts
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const submit = () => {
    if (!campaign) return;
    if (!locationId) return setError(t('locationRequired'));
    if (list.length === 0) return setError(t('contactsRequired'));
    send.mutate(
      {
        id: campaign.id,
        body: { recipients: list.map((contact) => ({ location_id: locationId, contact })) }
      },
      {
        onSuccess: (b) => {
          toast.success(t('done', { count: b.progress.total }));
          onClose();
        },
        onError: (e) => setError(errorText(e))
      }
    );
  };
  return (
    <Dialog open={!!campaign} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid='campaign-send-dialog'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {campaign ? t('description', { channel: campaign.channel }) : ''}
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <Field>
            <FieldLabel htmlFor='send-location'>{t('location')}</FieldLabel>
            <Select value={locationId} onValueChange={(v) => setLocationId(v ?? '')}>
              <SelectTrigger id='send-location' aria-label={t('location')}>
                <SelectValue placeholder={t('locationPlaceholder')}>
                  {(v: string) => locations?.items.find((l) => l.id === v)?.name ?? ''}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(locations?.items ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor='send-contacts'>{t('contacts')}</FieldLabel>
            <Textarea
              id='send-contacts'
              value={contacts}
              onChange={(e) => setContacts(e.target.value)}
              rows={4}
              placeholder={t('contactsPlaceholder')}
            />
            <FieldDescription>{t('contactsHint', { count: list.length })}</FieldDescription>
          </Field>
          {error && <FieldError>{error}</FieldError>}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={send.isPending} data-testid='campaign-send-submit'>
            {send.isPending && <Icons.spinner className='size-4 animate-spin' />}
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** S-GEN-01 «Кампании»: table by channel with stats, status switch, send requests, edit / delete. */
export function CampaignsList() {
  const t = useTranslations('review-generation');
  const format = useFormatter();
  const [p, setP] = useQueryStates(params, { shallow: true });
  const canEdit = useCan('reviews.reply');
  const queryClient = useQueryClient();
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data, isPending, isPlaceholderData } = useQuery({
    ...reviewCampaignsQueryOptions({
      page: 1,
      page_size: 100,
      ...(p.q ? { q: p.q } : {}),
      ...(p.channel ? { 'filter[channel]': [p.channel as Campaign['channel']] } : {}),
      ...(p.status ? { 'filter[status]': [p.status as Campaign['status']] } : {})
    }),
    placeholderData: (prev) => prev
  });
  const update = useMutation(updateReviewCampaignMutation(queryClient));
  const remove = useMutation(deleteReviewCampaignMutation(queryClient));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [sending, setSending] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const items = data?.items ?? [];

  const toggle = (c: Campaign) =>
    update.mutate(
      {
        id: c.id,
        body: {
          name: c.name,
          channel: c.channel,
          scope: c.scope,
          location_ids: c.location_ids ?? [],
          message_template: c.message_template,
          target_platform_ids: c.target_platform_ids,
          routing: c.routing,
          private_form_enabled: c.private_form_enabled ?? false,
          status: c.status === 'active' ? 'paused' : 'active'
        }
      },
      {
        onSuccess: (r) =>
          toast.success(r.status === 'active' ? t('actions.activated') : t('actions.paused')),
        onError: (e) => toast.error(errorText(e))
      }
    );

  return (
    <div className='flex flex-col gap-4' data-testid='campaigns-list'>
      <div className='flex flex-wrap items-center gap-2'>
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
          value={p.channel || ALL}
          onValueChange={(v) => setP({ channel: !v || v === ALL ? '' : v })}
        >
          <SelectTrigger
            className='h-8 w-40'
            aria-label={t('filters.channel')}
            data-testid='campaigns-channel'
          >
            <SelectValue>
              {(v: string) =>
                v === ALL ? t('filters.anyChannel') : t(`channels.${v as Campaign['channel']}`)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('filters.anyChannel')}</SelectItem>
            {CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>
                {t(`channels.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={p.status || ALL}
          onValueChange={(v) => setP({ status: !v || v === ALL ? '' : v })}
        >
          <SelectTrigger className='h-8 w-40' aria-label={t('filters.status')}>
            <SelectValue>
              {(v: string) =>
                v === ALL ? t('filters.anyStatus') : t(`sheet.statuses.${v as Campaign['status']}`)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('filters.anyStatus')}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`sheet.statuses.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <Button
            size='sm'
            onClick={() => {
              setEditing(null);
              setSheetOpen(true);
            }}
            data-testid='campaign-create'
          >
            <Icons.add className='size-4' /> {t('actions.create')}
          </Button>
        )}
      </div>

      <div className={cn('overflow-x-auto rounded-lg border', isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>{t('columns.campaign')}</TableHead>
              <TableHead>{t('columns.platforms')}</TableHead>
              <TableHead>{t('columns.routing')}</TableHead>
              <TableHead className='text-right'>{t('columns.sent')}</TableHead>
              <TableHead className='text-right'>{t('columns.opened')}</TableHead>
              <TableHead className='text-right'>{t('columns.clicked')}</TableHead>
              <TableHead className='text-right'>{t('columns.reviews')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead className='w-0' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Empty className='py-8'>
                    <EmptyHeader>
                      <EmptyMedia variant='icon'>
                        <Icons.megaphone />
                      </EmptyMedia>
                      <EmptyTitle>
                        {p.q || p.channel || p.status ? t('emptyFiltered') : t('empty')}
                      </EmptyTitle>
                      <EmptyDescription>{t('emptyHint')}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {items.map((c) => {
              const Icon = Icons[CHANNEL_ICON[c.channel]];
              return (
                <TableRow key={c.id} data-campaign={c.id} data-status={c.status}>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <span className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-md'>
                        <Icon className='size-4' />
                      </span>
                      <div className='min-w-0'>
                        <div className='font-medium'>{c.name}</div>
                        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                          <span>{t(`channels.${c.channel}`)}</span>
                          {c.short_link && (
                            <button
                              type='button'
                              className='inline-flex items-center gap-1 underline-offset-4 hover:underline'
                              onClick={() =>
                                navigator.clipboard
                                  .writeText(c.short_link!)
                                  .then(() => toast.success(t('actions.linkCopied')))
                              }
                            >
                              <Icons.copy className='size-3' />{' '}
                              {c.short_link.replace(/^https?:\/\//, '')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className='flex items-center gap-1'>
                      {c.target_platform_ids.map((pid) => (
                        <PlatformIcon
                          key={pid}
                          platformId={pid}
                          icon={platforms?.items.find((x) => x.id === pid)?.icon ?? null}
                          title={platforms?.items.find((x) => x.id === pid)?.name}
                        />
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className='text-xs'>
                    {t(`sheet.routings.${c.routing}.title`)}
                    {c.private_form_enabled && (
                      <span className='text-muted-foreground'> · {t('columns.privateForm')}</span>
                    )}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {c.channel === 'qr' ? '—' : format.number(c.stats.sent)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {format.number(c.stats.opened)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {format.number(c.stats.clicked)}
                  </TableCell>
                  <TableCell className='text-status-synced text-right font-medium tabular-nums'>
                    {format.number(c.stats.reviews_attributed)}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {canEdit && c.status !== 'archived' && c.status !== 'draft' ? (
                        <Switch
                          checked={c.status === 'active'}
                          disabled={update.isPending}
                          onCheckedChange={() => toggle(c)}
                          aria-label={`${t('columns.status')}: ${c.name}`}
                        />
                      ) : null}
                      <Badge variant='outline' className={cn('gap-1', STATUS_TONE[c.status])}>
                        <span className='size-1.5 rounded-full bg-current' aria-hidden />
                        {t(`sheet.statuses.${c.status}`)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className='flex justify-end gap-1'>
                        {c.channel !== 'qr' && c.channel !== 'link' && (
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-7'
                            onClick={() => setSending(c)}
                            data-testid='campaign-send'
                          >
                            <Icons.send className='size-3.5' /> {t('actions.send')}
                          </Button>
                        )}
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={`${t('actions.edit')}: ${c.name}`}
                          onClick={() => {
                            setEditing(c);
                            setSheetOpen(true);
                          }}
                        >
                          <Icons.edit className='size-3.5' />
                        </Button>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={`${t('actions.delete')}: ${c.name}`}
                          onClick={() => setDeleting(c)}
                        >
                          <Icons.trash className='size-3.5' />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CampaignSheet open={sheetOpen} onOpenChange={setSheetOpen} campaign={editing} />
      <SendDialog campaign={sending} onClose={() => setSending(null)} />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title={t('actions.delete')}
        description={deleting ? t('deleteConfirm', { name: deleting.name }) : ''}
        confirmLabel={t('actions.delete')}
        onConfirm={() =>
          deleting &&
          remove.mutate(
            { id: deleting.id },
            {
              onSuccess: () => {
                toast.success(t('deleted'));
                setDeleting(null);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
    </div>
  );
}
