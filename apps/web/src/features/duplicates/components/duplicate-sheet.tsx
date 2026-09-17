'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { LinkButton } from '@/components/ui/link-button';
import { Progress } from '@/components/ui/progress';
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
import { Textarea } from '@/components/ui/textarea';
import { locationQueryOptions } from '@/features/locations';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { actOnDuplicateMutation } from '../api/mutations';
import { duplicateQueryOptions } from '../api/queries';
import type { DuplicateAction, DuplicateCase } from '../api/types';

const FIELD_KEYS = ['name', 'address', 'phone', 'website', 'hours', 'categories'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

/** Actions available per case kind (SDD-04): duplicates merge / confirm, fakes are reported, owner conflicts are claimed. */
const ACTIONS: Record<DuplicateCase['kind'], DuplicateAction['action'][]> = {
  duplicate: ['merge', 'confirm_duplicate', 'dismiss'],
  fake: ['report_fake', 'dismiss'],
  conflicting_owner: ['claim', 'dismiss']
};

/** Two points on a schematic map: ours in the centre, theirs offset by `distance_m` (SDD-01 §9 «две точки на карте»). */
function TwoPointsMap({
  distance,
  ours,
  theirs
}: {
  distance: number | null;
  ours: string;
  theirs: string;
}) {
  const t = useTranslations('duplicates.sheet');
  const format = useFormatter();
  const d = Math.min(1, (distance ?? 0) / 500);
  // Schematic, not to scale: at a few metres the pins and labels would sit on top of each other.
  const x2 = 60 + Math.max(56, 100 * d);
  return (
    <figure className='bg-muted/40 rounded-lg border p-3' data-testid='duplicate-map'>
      <svg
        viewBox='0 0 220 110'
        className='h-28 w-full'
        role='img'
        aria-label={t('mapLabel', {
          distance: distance == null ? '—' : format.number(Math.round(distance))
        })}
      >
        <defs>
          <pattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'>
            <path d='M 20 0 L 0 0 0 20' fill='none' stroke='currentColor' strokeOpacity='0.08' />
          </pattern>
        </defs>
        <rect width='220' height='110' fill='url(#grid)' />
        <line
          x1='60'
          y1='55'
          x2={x2}
          y2='55'
          stroke='currentColor'
          strokeOpacity='0.4'
          strokeDasharray='4 3'
        />
        <circle cx='60' cy='55' r='9' className='fill-primary' />
        <circle cx={x2} cy='55' r='9' className='fill-status-error' />
        <text x='60' y='80' textAnchor='middle' fontSize='9' className='fill-foreground'>
          {t('ours')}
        </text>
        <text x={x2} y='80' textAnchor='middle' fontSize='9' className='fill-foreground'>
          {t('theirs')}
        </text>
        <text
          x={(60 + x2) / 2}
          y='45'
          textAnchor='middle'
          fontSize='9'
          className='fill-muted-foreground'
        >
          {distance == null ? '—' : `${format.number(Math.round(distance))} ${t('m')}`}
        </text>
      </svg>
      <figcaption className='text-muted-foreground mt-1 flex justify-between gap-4 text-[11px]'>
        <span className='min-w-0 truncate'>{ours}</span>
        <span className='min-w-0 truncate text-right'>{theirs}</span>
      </figcaption>
    </figure>
  );
}

/** Case details: schematic map, field comparison, scoring explanation, actions with an optional note. */
export function DuplicateSheet({
  caseId,
  onClose,
  canEdit
}: {
  caseId: string | null;
  onClose: () => void;
  canEdit: boolean;
}) {
  const t = useTranslations('duplicates.sheet');
  const tk = useTranslations('duplicates.kinds');
  const ts = useTranslations('duplicates.states');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    ...duplicateQueryOptions(caseId ?? ''),
    enabled: !!caseId
  });
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data: location } = useQuery({
    ...locationQueryOptions(data?.location_id ?? ''),
    enabled: !!data
  });
  const act = useMutation(actOnDuplicateMutation(queryClient));
  const [note, setNote] = useState('');
  const platform = platforms?.items.find((p) => p.id === data?.platform_id);

  const doAction = (action: DuplicateAction['action']) =>
    data &&
    act.mutate(
      { id: data.id, body: { action, ...(note.trim() ? { note: note.trim() } : {}) } },
      {
        onSuccess: () => {
          toast.success(t(`done.${action}`));
          setNote('');
          onClose();
        },
        onError: (e) => toast.error(errorText(e))
      }
    );

  return (
    <Sheet open={!!caseId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className='flex w-full flex-col gap-0 p-0 sm:max-w-2xl'
        data-testid='duplicate-sheet'
      >
        <SheetHeader className='border-b'>
          <SheetTitle className='flex flex-wrap items-center gap-2'>
            {data ? (data.listing.observed_name ?? t('title')) : t('title')}
            {data && <Badge variant='outline'>{tk(data.kind)}</Badge>}
            {data && <Badge variant='outline'>{ts(data.state)}</Badge>}
          </SheetTitle>
          <SheetDescription className='flex items-center gap-2'>
            {data && (
              <>
                <PlatformIcon platformId={data.platform_id} icon={platform?.icon ?? null} />
                {platform?.name ?? data.platform_id}
                {data.listing.url && (
                  <a
                    href={data.listing.url}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-1 underline-offset-4 hover:underline'
                  >
                    <Icons.externalLink className='size-3.5' /> {t('openListing')}
                  </a>
                )}
              </>
            )}
          </SheetDescription>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-5 overflow-y-auto p-4'>
          {isPending || !data ? (
            <Skeleton className='h-96' />
          ) : (
            <>
              <div className='grid gap-4 sm:grid-cols-[1fr_14rem]'>
                <TwoPointsMap
                  distance={data.distance_m ?? null}
                  ours={data.location_name ?? ''}
                  theirs={data.listing.observed_name ?? '—'}
                />
                <div className='flex flex-col gap-2 rounded-lg border p-3'>
                  <span className='text-muted-foreground text-xs'>{t('score')}</span>
                  <div className='flex items-center gap-2'>
                    <Progress value={data.score * 100} className='h-2 flex-1' />
                    <span
                      className='text-sm font-medium tabular-nums'
                      data-testid='duplicate-score'
                    >
                      {Math.round(data.score * 100)} %
                    </span>
                  </div>
                  <ul className='mt-1 flex flex-col gap-1 text-xs'>
                    {data.reasons.map((r) => (
                      <li key={r.feature} className='flex items-start gap-2'>
                        <span className='text-muted-foreground w-10 shrink-0 tabular-nums'>
                          +{Math.round(r.weight * 100)}
                        </span>
                        <span>{r.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <section className='flex flex-col gap-2'>
                <h4 className='text-sm font-semibold'>{t('comparison')}</h4>
                <div className='overflow-hidden rounded-lg border'>
                  <Table data-testid='duplicate-comparison'>
                    <TableHeader className='bg-muted'>
                      <TableRow>
                        <TableHead className='w-32'>{t('field')}</TableHead>
                        <TableHead>{t('ours')}</TableHead>
                        <TableHead>{t('theirs')}</TableHead>
                        <TableHead className='w-10' />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.comparison ?? []).map((c) => (
                        <TableRow key={c.field} className={cn(!c.match && 'bg-status-error-bg/30')}>
                          <TableCell className='text-muted-foreground'>
                            {FIELD_KEYS.includes(c.field as FieldKey)
                              ? t(`fields.${c.field as FieldKey}`)
                              : c.field}
                          </TableCell>
                          <TableCell>{c.ours ?? '—'}</TableCell>
                          <TableCell>{c.theirs ?? '—'}</TableCell>
                          <TableCell>
                            {c.match ? (
                              <Icons.circleCheck
                                className='text-status-synced size-4'
                                aria-label={t('match')}
                              />
                            ) : (
                              <Icons.circleX
                                className='text-status-error size-4'
                                aria-label={t('mismatch')}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className='grid gap-3 text-sm sm:grid-cols-2'>
                <div className='rounded-lg border p-3'>
                  <div className='text-muted-foreground text-xs'>{t('ourLocation')}</div>
                  <div className='font-medium'>{data.location_name}</div>
                  <div className='text-muted-foreground text-xs'>
                    {location?.address.free_form ?? ''}
                  </div>
                  <LinkButton
                    href={`/dashboard/locations/${data.location_id}`}
                    variant='ghost'
                    size='sm'
                    className='mt-2 h-7 px-2'
                  >
                    {t('openLocation')}
                  </LinkButton>
                </div>
                <div className='rounded-lg border p-3'>
                  <div className='text-muted-foreground text-xs'>{t('found')}</div>
                  <div className='font-medium'>{data.listing.observed_name ?? '—'}</div>
                  <div className='text-muted-foreground text-xs'>
                    {data.listing.observed_address ?? ''}
                  </div>
                  <div className='text-muted-foreground mt-2 text-xs'>
                    {t('createdAt', { date: format.dateTime(new Date(data.created_at), 'medium') })}
                  </div>
                </div>
              </section>

              {canEdit && data.state === 'open' && (
                <Field>
                  <FieldLabel htmlFor='dup-note'>{t('note')}</FieldLabel>
                  <Textarea
                    id='dup-note'
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder={t('notePlaceholder')}
                  />
                </Field>
              )}
            </>
          )}
        </div>
        {data && canEdit && data.state === 'open' && (
          <SheetFooter className='flex-row flex-wrap justify-end gap-2 border-t'>
            {ACTIONS[data.kind].map((action, i) => (
              <Button
                key={action}
                variant={i === 0 ? 'default' : action === 'dismiss' ? 'ghost' : 'outline'}
                disabled={act.isPending}
                onClick={() => doAction(action)}
                data-testid={`dup-action-${action}`}
              >
                {act.isPending && act.variables?.body.action === action && (
                  <Icons.spinner className='size-4 animate-spin' />
                )}
                {t(`actions.${action}`)}
              </Button>
            ))}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
