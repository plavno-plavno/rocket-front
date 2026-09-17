'use client';

import {
  type InfiniteData,
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon, RatingStars, ReviewVersionDiff } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCan, useMe } from '@/features/session';
import { platformsQueryOptions } from '@/features/sources';
import { TagPicker } from '@/features/tags';
import { UserCombobox } from '@/features/users';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  createReviewNoteMutation,
  deleteReviewNoteMutation,
  deleteReviewReplyMutation,
  updateReviewMutation
} from '../api/mutations';
import {
  reviewActivityQueryOptions,
  reviewComplaintsQueryOptions,
  reviewNotesQueryOptions,
  reviewQueryOptions,
  reviewRepliesQueryOptions,
  reviewVersionsQueryOptions,
  reviewsKeys
} from '../api/queries';
import type { Review, ReviewReply } from '../api/types';
import { WORKFLOW_STATUSES } from '../searchparams';
import { ComplaintDialog } from './inbox/complaint-dialog';
import { ReplyComposer, type ReplyComposerHandle } from './inbox/reply-composer';

export interface ReviewDetailHandle {
  focusReply: () => void;
  openTags: () => void;
  openAssignee: () => void;
}

export interface ReviewDetailProps {
  reviewId: string;
  /** Inside the drawer: tighter spacing, no link to itself. */
  compact?: boolean;
  /** Link to the inbox (drawer only). */
  showInboxLink?: boolean;
}

/** A review already loaded by any list (infinite inbox pages or a plain page) — or undefined. */
function reviewFromLists(queryClient: QueryClient, id: string): Review | undefined {
  for (const [, data] of queryClient.getQueriesData<
    { items: Review[] } | InfiniteData<{ items: Review[] }>
  >({ queryKey: [...reviewsKeys.all, 'reviews'] })) {
    if (!data) continue;
    const pages = 'pages' in data ? data.pages : [data];
    for (const page of pages) {
      const hit = page.items?.find((r) => r.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function formatDuration(seconds: number, t: (k: 'h' | 'm' | 's', n: number) => string) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h ? t('h', h) : '', m ? t('m', m) : '', !h && s ? t('s', s) : '']
    .filter(Boolean)
    .join(' ');
}

/**
 * Centre column of the inbox (SCR-3) and body of the public `ReviewDrawer`:
 * header, text with version diff, workflow controls, tabs (replies / notes / history), composer.
 */
export const ReviewDetail = forwardRef<ReviewDetailHandle, ReviewDetailProps>(function ReviewDetail(
  { reviewId, compact, showInboxLink },
  ref
) {
  const t = useTranslations('reviews.detail');
  const tw = useTranslations('reviews.workflow');
  const tl = useTranslations('reviews.list');
  const tc = useTranslations('common');
  const td = useTranslations('reviews.drawer.replyState');
  const tdr = useTranslations('reviews.drawer');
  const format = useFormatter();
  const now = useNow({ updateInterval: 30_000 });
  const queryClient = useQueryClient();
  const canReply = useCan('reviews.reply');
  const canEdit = useCan('reviews.reply');
  const me = useMe();

  const {
    data: review,
    isPending,
    isError
  } = useQuery({
    ...reviewQueryOptions(reviewId),
    // Lists already hold the full Review: show it at once, refresh in the background.
    placeholderData: () => reviewFromLists(queryClient, reviewId)
  });
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data: replies } = useQuery({
    ...reviewRepliesQueryOptions(reviewId),
    refetchInterval: (q) =>
      q.state.data?.items.some((r) => r.state === 'requested') ? 1500 : false
  });
  const hasRequested = !!replies?.items.some((r) => r.state === 'requested');
  const prevRequested = useRef(false);
  useEffect(() => {
    // A reply finished publishing on the platform → status / counters of the review changed.
    if (prevRequested.current && !hasRequested)
      void queryClient.invalidateQueries({ queryKey: reviewsKeys.all });
    prevRequested.current = hasRequested;
  }, [hasRequested, queryClient]);
  const { data: notes } = useQuery(reviewNotesQueryOptions(reviewId));
  const { data: versions } = useQuery({
    ...reviewVersionsQueryOptions(reviewId),
    enabled: review?.platform_state === 'edited'
  });
  const { data: complaints } = useQuery(reviewComplaintsQueryOptions(reviewId));
  const [tab, setTab] = useState('replies');
  const { data: activity } = useQuery({
    ...reviewActivityQueryOptions(reviewId),
    enabled: tab === 'history'
  });

  const update = useMutation(updateReviewMutation(queryClient));
  const deleteReply = useMutation(deleteReviewReplyMutation(queryClient));
  const addNote = useMutation(createReviewNoteMutation(queryClient));
  const removeNote = useMutation(deleteReviewNoteMutation(queryClient));

  const [editing, setEditing] = useState<ReviewReply | null>(null);
  const [deleting, setDeleting] = useState<ReviewReply | null>(null);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [note, setNote] = useState('');
  const [tagsOpen, setTagsOpen] = useState(0);
  const [assigneeOpen, setAssigneeOpen] = useState(0);
  const composerRef = useRef<ReplyComposerHandle>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      focusReply: () => {
        setTab('replies');
        setTimeout(() => composerRef.current?.focus(), 0);
      },
      openTags: () => {
        setTagsOpen((n) => n + 1);
        tagsRef.current?.querySelector<HTMLElement>('button')?.click();
      },
      openAssignee: () => {
        setAssigneeOpen((n) => n + 1);
        assigneeRef.current?.querySelector<HTMLElement>('button,[role=combobox]')?.click();
      }
    }),
    []
  );
  void tagsOpen;
  void assigneeOpen;

  if (isError && !review) {
    return (
      <Empty className='h-full py-12' data-testid='review-detail-error'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.alertCircle />
          </EmptyMedia>
          <EmptyTitle>{t('notFound')}</EmptyTitle>
          <EmptyDescription>{t('notFoundHint')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isPending || !review) {
    return (
      <div className='flex flex-col gap-3 p-4' data-testid='review-detail-loading'>
        <Skeleton className='h-5 w-1/2' />
        <Skeleton className='h-4 w-1/3' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-40 w-full' />
      </div>
    );
  }

  const platform = platforms?.items.find((p) => p.id === review.platform_id);
  const caps = platform?.capabilities.reviews;
  const platformCanReply = caps?.reply !== false;
  const platformCanComplain = !!caps?.complain;
  const prev = versions?.items.find((v) => v.version === review.current_version - 1);
  const latestComplaint = complaints?.items[0];
  const reviewContext = {
    author_name: review.author.name,
    location_name: review.location_name ?? '',
    rating: review.rating == null ? '' : String(review.rating),
    manager_name: me.user.name,
    platform_name: platform?.name ?? ''
  };

  const patch = async (body: Parameters<typeof update.mutateAsync>[0]['body'], msg: string) => {
    try {
      await update.mutateAsync({ id: review.id, body });
      toast.success(msg);
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const durationLabel = (s: number) =>
    formatDuration(s, (k, n) =>
      k === 'h'
        ? format.number(n) + ' ч'
        : k === 'm'
          ? format.number(n) + ' мин'
          : format.number(n) + ' с'
    );

  return (
    <div
      className={cn('flex h-full flex-col overflow-y-auto', compact ? 'gap-3' : 'gap-4 p-4')}
      data-testid='review-detail'
      data-review-id={review.id}
    >
      {/* Header */}
      <div className='flex flex-wrap items-start gap-2'>
        <PlatformIcon
          platformId={review.platform_id}
          icon={platform?.icon}
          className='mt-0.5 size-5'
        />
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
            <span className='font-semibold'>{review.author.name}</span>
            <RatingStars rating={review.rating} size='md' />
            {review.sentiment && (
              <Badge
                variant='outline'
                className={cn(
                  'h-5 text-[10px]',
                  review.sentiment === 'positive' && 'text-rating-positive',
                  review.sentiment === 'negative' && 'text-rating-negative'
                )}
              >
                {t(`sentiment.${review.sentiment}`)}
              </Badge>
            )}
          </div>
          <div className='text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs'>
            <LinkButton
              variant='link'
              size='sm'
              className='text-muted-foreground h-auto p-0 text-xs'
              href={`/dashboard/locations/${review.location_id}`}
            >
              {review.location_name}
            </LinkButton>
            <span>·</span>
            <time dateTime={review.published_at}>
              {format.dateTime(new Date(review.published_at), 'long')}
            </time>
            {platform && (
              <>
                <span>·</span>
                <span>{platform.name}</span>
              </>
            )}
          </div>
        </div>
        <div className='flex items-center gap-1'>
          {review.url && (
            <LinkButton
              variant='ghost'
              size='icon-sm'
              aria-label={t('openOnPlatform')}
              title={t('openOnPlatform')}
              href={review.url}
              target='_blank'
              rel='noreferrer'
            >
              <Icons.externalLink className='size-4' />
            </LinkButton>
          )}
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('copyLink')}
            title={t('copyLink')}
            onClick={() => {
              void navigator.clipboard.writeText(
                `${window.location.origin}/dashboard/reviews?review=${review.id}`
              );
              toast.success(t('copied'));
            }}
          >
            <Icons.copy className='size-4' />
          </Button>
        </div>
      </div>

      {/* Text */}
      <div className='flex flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          {review.platform_state === 'edited' && (
            <ReviewVersionDiff
              before={prev?.text ?? null}
              after={review.text}
              beforeRating={prev?.rating}
              afterRating={review.rating}
            />
          )}
          {review.platform_state === 'deleted_by_author' && (
            <Badge variant='outline' className='text-muted-foreground'>
              {t('deletedByAuthor')}
            </Badge>
          )}
          {review.platform_state === 'removed_by_platform' && (
            <Badge variant='outline' className='text-status-error'>
              {t('removedByPlatform')}
            </Badge>
          )}
          {latestComplaint && (
            <Badge variant='outline' className='text-status-action'>
              {t(`complaint.state.${latestComplaint.state}`)}
            </Badge>
          )}
        </div>
        <p
          className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap',
            !review.text && 'text-muted-foreground italic',
            review.platform_state === 'deleted_by_author' && 'line-through opacity-70'
          )}
        >
          {review.text ?? tl('noText')}
        </p>
        {review.aspects?.length ? (
          <div className='flex flex-wrap gap-1'>
            {review.aspects.map((a) => (
              <Badge
                key={a.topic}
                variant='secondary'
                className={cn(
                  'h-5 text-[10px] font-normal',
                  a.sentiment === 'negative' && 'text-rating-negative',
                  a.sentiment === 'positive' && 'text-rating-positive'
                )}
              >
                {a.topic}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {/* Workflow */}
      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'sm:grid-cols-3')}>
        <div ref={assigneeRef} className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>{t('assignee')}</span>
          <UserCombobox
            value={review.assignee_user_id ?? null}
            onChange={(id) => patch({ assignee_user_id: id }, t('assigneeUpdated'))}
            placeholder={t('unassigned')}
            disabled={!canEdit}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>{t('status')}</span>
          <Select
            value={review.workflow_status}
            onValueChange={(v) =>
              v && patch({ workflow_status: v as Review['workflow_status'] }, t('statusUpdated'))
            }
            disabled={!canEdit}
          >
            <SelectTrigger size='sm' aria-label={t('status')} data-testid='workflow-status'>
              <SelectValue>{(v: Review['workflow_status']) => tw(v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {WORKFLOW_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {tw(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div ref={tagsRef} className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>{t('tags')}</span>
          <TagPicker
            value={review.tag_ids}
            onChange={(ids) => patch({ tag_ids: ids }, t('tagsUpdated'))}
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as string)} className='flex-1'>
        <TabsList>
          <TabsTrigger value='replies'>
            {t('tabs.replies', { count: replies?.items.length ?? review.reply_count })}
          </TabsTrigger>
          <TabsTrigger value='notes'>
            {t('tabs.notes', { count: notes?.items.length ?? review.note_count })}
          </TabsTrigger>
          <TabsTrigger value='history'>{t('tabs.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value='replies' className='flex flex-col gap-3 pt-3'>
          {replies?.items.length ? (
            replies.items
              .filter((r) => r.state !== 'deleted')
              .map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    'rounded-md border p-3 text-sm',
                    r.state === 'failed' && 'border-status-error/40 bg-status-error-bg/30',
                    r.state === 'draft' && 'border-dashed'
                  )}
                  data-testid='reply'
                  data-state={r.state}
                >
                  {editing?.id === r.id ? (
                    <ReplyComposer
                      review={review}
                      reviewContext={reviewContext}
                      canReply={platformCanReply}
                      editing={r}
                      onCancelEdit={() => setEditing(null)}
                      compact
                    />
                  ) : (
                    <>
                      <div className='text-muted-foreground mb-1 flex flex-wrap items-center gap-x-2 text-xs'>
                        <span className='text-foreground font-medium'>
                          {r.author_name ?? t('history.system')}
                        </span>
                        <span>·</span>
                        <span>{t(`origin.${r.origin}`)}</span>
                        <span>·</span>
                        <Badge
                          variant='outline'
                          className={cn(
                            'h-4 px-1 text-[10px]',
                            r.state === 'published' && 'text-status-synced',
                            r.state === 'requested' && 'text-status-sent',
                            r.state === 'failed' && 'text-status-error'
                          )}
                        >
                          {r.state === 'requested' && (
                            <Icons.spinner className='mr-1 size-3 animate-spin' />
                          )}
                          {td(r.state)}
                        </Badge>
                        {r.published_at && (
                          <time dateTime={r.published_at}>
                            {format.relativeTime(new Date(r.published_at), now)}
                          </time>
                        )}
                        {r.response_time_s != null && (
                          <span>
                            · {t('responseTime', { time: durationLabel(r.response_time_s) })}
                          </span>
                        )}
                        {canReply && r.origin !== 'platform_imported' && (
                          <span className='ml-auto flex gap-1'>
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              aria-label={t('editReply')}
                              onClick={() => setEditing(r)}
                            >
                              <Icons.edit className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              aria-label={t('deleteReply')}
                              onClick={() => setDeleting(r)}
                            >
                              <Icons.trash className='size-3.5' />
                            </Button>
                          </span>
                        )}
                      </div>
                      <p className='whitespace-pre-wrap'>{r.text}</p>
                      {r.error && <p className='text-status-error mt-1 text-xs'>{r.error}</p>}
                    </>
                  )}
                </div>
              ))
          ) : (
            <p className='text-muted-foreground text-xs'>{t('noReplies')}</p>
          )}
          {canReply && !editing && (
            <ReplyComposer
              ref={composerRef}
              review={review}
              reviewContext={reviewContext}
              canReply={platformCanReply}
              compact={compact}
            />
          )}
        </TabsContent>

        <TabsContent value='notes' className='flex flex-col gap-3 pt-3'>
          <p className='text-muted-foreground text-xs'>{t('noteHint')}</p>
          {notes?.items.length ? (
            notes.items.map((n) => (
              <div key={n.id} className='bg-muted/50 rounded-md p-3 text-sm' data-testid='note'>
                <div className='text-muted-foreground mb-1 flex items-center gap-2 text-xs'>
                  <span className='text-foreground font-medium'>{n.user_name}</span>
                  <time dateTime={n.created_at}>
                    {format.relativeTime(new Date(n.created_at), now)}
                  </time>
                  {(n.user_id === me.user.id || canEdit) && (
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      className='ml-auto'
                      aria-label={t('deleteNote')}
                      onClick={() =>
                        removeNote.mutate(
                          { id: review.id, noteId: n.id },
                          { onError: (e) => toast.error(errorText(e)) }
                        )
                      }
                    >
                      <Icons.trash className='size-3.5' />
                    </Button>
                  )}
                </div>
                <p className='whitespace-pre-wrap'>{n.text}</p>
              </div>
            ))
          ) : (
            <p className='text-muted-foreground text-xs'>{t('noNotes')}</p>
          )}
          <div className='flex flex-col gap-2'>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notePlaceholder')}
              rows={2}
              aria-label={t('addNote')}
            />
            <Button
              size='sm'
              className='self-end'
              disabled={!note.trim() || addNote.isPending}
              onClick={() =>
                addNote.mutate(
                  { id: review.id, body: { text: note.trim() } },
                  {
                    onSuccess: () => {
                      setNote('');
                      toast.success(t('noteAdded'));
                    },
                    onError: (e) => toast.error(errorText(e))
                  }
                )
              }
            >
              {t('addNote')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value='history' className='pt-3'>
          <ol className='flex flex-col gap-2 text-sm'>
            {(activity?.items ?? []).map((a) => (
              <li key={a.id} className='flex gap-3'>
                <time
                  dateTime={a.at}
                  className='text-muted-foreground w-32 shrink-0 text-xs tabular-nums'
                >
                  {format.dateTime(new Date(a.at), 'medium')}
                </time>
                <div>
                  <span>{t(`history.${a.type}`)}</span>
                  <span className='text-muted-foreground'>
                    {' · '}
                    {a.actor.kind === 'user' ? (a.actor.name ?? '') : t(`history.${a.actor.kind}`)}
                  </span>
                </div>
              </li>
            ))}
            {activity && activity.items.length === 0 && (
              <li className='text-muted-foreground text-xs'>—</li>
            )}
          </ol>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <div className='flex flex-wrap items-center gap-2 border-t pt-3'>
        {platformCanComplain && canReply && !latestComplaint && (
          <Button variant='outline' size='sm' onClick={() => setComplaintOpen(true)}>
            <Icons.warning className='size-4' /> {t('complain')}
          </Button>
        )}
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            void navigator.clipboard.writeText(review.text ?? '');
            toast.success(t('textCopied'));
          }}
          disabled={!review.text}
        >
          <Icons.copy className='size-4' /> {t('copyText')}
        </Button>
        {showInboxLink && (
          <LinkButton
            variant='outline'
            size='sm'
            className='ml-auto'
            href={`/dashboard/reviews?review=${review.id}`}
          >
            {tdr('openInInbox')}
          </LinkButton>
        )}
      </div>

      <ComplaintDialog
        open={complaintOpen}
        onOpenChange={setComplaintOpen}
        reviewId={review.id}
        platformId={review.platform_id}
      />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        loading={deleteReply.isPending}
        title={t('deleteReply')}
        description={t('deleteReplyConfirm')}
        confirmLabel={tc('delete')}
        onConfirm={() =>
          deleting &&
          deleteReply.mutate(
            { id: review.id, replyId: deleting.id },
            {
              onSuccess: () => {
                setDeleting(null);
                toast.success(t('replyDeleted'));
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
    </div>
  );
});
