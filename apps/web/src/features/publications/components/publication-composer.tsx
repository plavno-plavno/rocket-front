'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LocationPicker } from '@/features/locations';
import { mediaAssetsQueryOptions } from '@/features/media';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { createPublicationMutation, updatePublicationMutation } from '../api/mutations';
import type { Publication, PublicationCreate } from '../api/types';

const TYPES: Publication['type'][] = ['news', 'offer', 'event'];
const CTA_KINDS = ['call', 'website', 'book', 'order', 'learn_more'] as const;
type CtaKind = (typeof CTA_KINDS)[number];
const MAX_TEXT = 1500;

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

/** `datetime-local` value ↔ ISO. */
const toLocal = (iso: string | null | undefined) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : '';
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

/** Composer of S-PUB-01: type, title, text with live preview, media from the library, CTA, platforms, scope, schedule. */
export function PublicationComposer({
  open,
  onOpenChange,
  publication
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  publication: Publication | null;
}) {
  const t = useTranslations('publications.composer');
  const tt = useTranslations('publications.types');
  const queryClient = useQueryClient();
  const { data: platforms } = useQuery({ ...platformsQueryOptions(), enabled: open });
  const { data: media } = useQuery({
    ...mediaAssetsQueryOptions({ page: 1, page_size: 24 }),
    enabled: open
  });
  const create = useMutation(createPublicationMutation(queryClient));
  const update = useMutation(updatePublicationMutation(queryClient));

  const [type, setType] = useState<Publication['type']>('news');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [ctaKind, setCtaKind] = useState<CtaKind | ''>('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType(publication?.type ?? 'news');
    setTitle(publication?.title ?? '');
    setText(publication?.text ?? '');
    setMediaIds(publication?.media_ids ?? []);
    setCtaKind((publication?.cta?.kind as CtaKind | undefined) ?? '');
    setCtaUrl(publication?.cta?.url ?? '');
    setPlatformIds(publication?.platform_ids ?? []);
    const scope = publication?.scope ?? 'all';
    setGroupIds(scope !== 'all' && scope.startsWith('grp_') ? scope.split(',') : []);
    setLocationIds(publication?.scope === 'all' ? [] : (publication?.location_ids ?? []));
    setSchedule(toLocal(publication?.schedule_at));
    setError(null);
  }, [open, publication]);

  const supported = (platforms?.items ?? []).filter((p) => p.capabilities.publications?.create);
  const typeSupported = (id: string) => {
    const p = supported.find((x) => x.id === id);
    const types = p?.capabilities.publications?.types;
    return !types || types.includes(type);
  };
  const pending = create.isPending || update.isPending;
  const selectedMedia = (media?.items ?? []).filter((m) => mediaIds.includes(m.id));

  const submit = async () => {
    if (!text.trim()) return setError(t('textRequired'));
    if (platformIds.length === 0) return setError(t('platformsRequired'));
    if (ctaKind && ctaKind !== 'call' && !/^https?:\/\//.test(ctaUrl))
      return setError(t('ctaUrlInvalid'));
    const body: PublicationCreate = {
      type,
      title: title.trim() || null,
      text: text.trim(),
      media_ids: mediaIds,
      cta: ctaKind ? { kind: ctaKind, url: ctaKind === 'call' ? null : ctaUrl } : null,
      platform_ids: platformIds.filter(typeSupported),
      scope: groupIds.length ? groupIds.join(',') : 'all',
      location_ids: locationIds,
      schedule_at: toIso(schedule)
    };
    try {
      if (publication) await update.mutateAsync({ id: publication.id, body });
      else await create.mutateAsync({ body });
      toast.success(schedule ? t('scheduled') : publication ? t('updated') : t('published'));
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='flex w-full flex-col gap-0 p-0 sm:max-w-4xl'
        data-testid='publication-composer'
      >
        <SheetHeader className='border-b'>
          <SheetTitle>{publication ? t('editTitle') : t('createTitle')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>
        <div className='grid flex-1 gap-6 overflow-y-auto p-4 lg:grid-cols-[1fr_20rem]'>
          <div className='flex flex-col gap-4'>
            <Field>
              <FieldLabel>{t('type')}</FieldLabel>
              <ToggleGroup
                value={[type]}
                onValueChange={(v) => {
                  const next = (Array.isArray(v) ? v[0] : v) as Publication['type'] | undefined;
                  if (next) setType(next);
                }}
                aria-label={t('type')}
              >
                {TYPES.map((x) => (
                  <ToggleGroupItem key={x} value={x} size='sm' data-testid={`pub-type-${x}`}>
                    {tt(x)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor='pub-title'>{t('title')}</FieldLabel>
              <Input
                id='pub-title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder={t('titlePlaceholder')}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='pub-text'>{t('text')} *</FieldLabel>
              <Textarea
                id='pub-text'
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
                rows={6}
                placeholder={t('textPlaceholder')}
              />
              <FieldDescription className='text-right'>
                {text.length} / {MAX_TEXT}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>{t('media')}</FieldLabel>
              <div className='grid grid-cols-4 gap-2 sm:grid-cols-6' data-testid='pub-media'>
                {(media?.items ?? []).map((m) => {
                  const on = mediaIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type='button'
                      aria-pressed={on}
                      aria-label={m.kind}
                      onClick={() =>
                        setMediaIds(on ? mediaIds.filter((x) => x !== m.id) : [...mediaIds, m.id])
                      }
                      className={cn(
                        'relative aspect-[3/2] overflow-hidden rounded-md border',
                        on && 'ring-primary ring-2'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.thumbnail_url ?? m.url}
                        alt=''
                        className='size-full object-cover'
                        loading='lazy'
                      />
                      {on && (
                        <span className='bg-primary text-primary-foreground absolute top-1 right-1 rounded-full p-0.5'>
                          <Icons.check className='size-3' />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <FieldDescription>{t('mediaHint')}</FieldDescription>
            </Field>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field>
                <FieldLabel htmlFor='pub-cta'>{t('cta')}</FieldLabel>
                <Select
                  value={ctaKind || '__none__'}
                  onValueChange={(v) => setCtaKind(!v || v === '__none__' ? '' : (v as CtaKind))}
                >
                  <SelectTrigger id='pub-cta' aria-label={t('cta')}>
                    <SelectValue>
                      {(v: string) =>
                        v === '__none__' ? t('ctaNone') : t(`ctaKinds.${v as CtaKind}`)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='__none__'>{t('ctaNone')}</SelectItem>
                    {CTA_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {t(`ctaKinds.${k}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {ctaKind && ctaKind !== 'call' && (
                <Field>
                  <FieldLabel htmlFor='pub-cta-url'>{t('ctaUrl')}</FieldLabel>
                  <Input
                    id='pub-cta-url'
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder='https://'
                    inputMode='url'
                  />
                </Field>
              )}
            </div>
            <Field>
              <FieldLabel>{t('platforms')} *</FieldLabel>
              <div className='grid gap-2 sm:grid-cols-2' data-testid='pub-platforms'>
                {supported.map((p) => {
                  const ok = typeSupported(p.id);
                  return (
                    <Label
                      key={p.id}
                      className={cn('flex items-center gap-2 font-normal', !ok && 'opacity-50')}
                    >
                      <Checkbox
                        checked={platformIds.includes(p.id)}
                        disabled={!ok}
                        onCheckedChange={(v) =>
                          setPlatformIds(
                            v ? [...platformIds, p.id] : platformIds.filter((x) => x !== p.id)
                          )
                        }
                      />
                      <PlatformIcon platformId={p.id} icon={p.icon} />
                      {p.name}
                      {!ok && (
                        <span className='text-muted-foreground text-xs'>
                          {t('typeUnsupported')}
                        </span>
                      )}
                    </Label>
                  );
                })}
              </div>
            </Field>
            <Field>
              <FieldLabel>{t('scope')}</FieldLabel>
              <div className='flex flex-wrap items-center gap-3'>
                <span className='text-sm'>
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
            <Field>
              <FieldLabel htmlFor='pub-schedule'>{t('schedule')}</FieldLabel>
              <Input
                id='pub-schedule'
                type='datetime-local'
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className='max-w-xs'
              />
              <FieldDescription>{t('scheduleHint')}</FieldDescription>
            </Field>
            {error && <FieldError>{error}</FieldError>}
          </div>

          <aside className='flex flex-col gap-2' data-testid='pub-preview'>
            <span className='text-muted-foreground text-xs'>{t('preview')}</span>
            <div className='bg-card overflow-hidden rounded-xl border shadow-sm'>
              {selectedMedia[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMedia[0].url}
                  alt=''
                  className='aspect-[3/2] w-full object-cover'
                />
              )}
              <div className='flex flex-col gap-2 p-3'>
                <Badge variant='secondary' className='w-fit'>
                  {tt(type)}
                </Badge>
                <p className='font-semibold'>{title || t('previewTitle')}</p>
                <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                  {text || t('previewText')}
                </p>
                {ctaKind && (
                  <Button size='sm' variant='outline' className='w-fit' tabIndex={-1}>
                    {t(`ctaKinds.${ctaKind}`)}
                  </Button>
                )}
              </div>
            </div>
          </aside>
        </div>
        <SheetFooter className='flex-row justify-end gap-2 border-t'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending} data-testid='pub-submit'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {schedule ? t('submitSchedule') : t('submitPublish')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
