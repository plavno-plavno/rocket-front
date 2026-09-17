'use client';

import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Icons } from '@/components/icons';
import { PlatformIcon, RatingStars } from '@/components/lp';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Review } from '../../api/types';

export interface ReviewListProps {
  items: Review[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isPending: boolean;
  /** Filters changed: previous items stay visible (dimmed) until the new page arrives. */
  refreshing?: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  /** Unread SSE events since the last refresh. */
  newCount: number;
  onShowNew: () => void;
  /** user id → { name, avatar } for the assignee avatar. */
  users: Map<string, { name: string; avatar?: string | null }>;
  total?: number;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Left column of the inbox: compact previews (SCR-3), «N новых» banner, «Загрузить ещё». */
export function ReviewList({
  items,
  selectedId,
  onSelect,
  isPending,
  refreshing,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  newCount,
  onShowNew,
  users,
  total
}: ReviewListProps) {
  const t = useTranslations('reviews.list');
  const tw = useTranslations('reviews.workflow');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the selected item in view when navigating with j/k.
  useEffect(() => {
    if (!selectedId) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-review-id="${selectedId}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <div className='flex h-full flex-col' data-testid='review-list'>
      {newCount > 0 && (
        <button
          type='button'
          onClick={onShowNew}
          className='bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium'
          data-testid='new-reviews-banner'
        >
          <Icons.chevronUp className='size-3.5' />
          {t('newCount', { count: newCount })} · {t('show')}
        </button>
      )}
      <div
        ref={listRef}
        className='flex-1 overflow-y-auto transition-opacity duration-200 aria-busy:opacity-60'
        aria-busy={isPending || refreshing || undefined}
      >
        {isPending &&
          Array.from({ length: 8 }, (_, i) => (
            <div key={i} className='flex flex-col gap-2 border-b p-3'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-1/3' />
              <Skeleton className='h-8 w-full' />
            </div>
          ))}
        {!isPending && items.length === 0 && (
          <Empty className='py-12'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icons.chat />
              </EmptyMedia>
              <EmptyTitle>{t('empty')}</EmptyTitle>
              <EmptyDescription>{t('emptyHint')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {items.map((r) => {
          const assignee = r.assignee_user_id ? users.get(r.assignee_user_id) : undefined;
          const selected = r.id === selectedId;
          return (
            <button
              type='button'
              key={r.id}
              data-review-id={r.id}
              aria-current={selected ? 'true' : undefined}
              onClick={() => onSelect(r.id)}
              className={cn(
                'w-full text-left',
                'hover:bg-muted/60 focus-visible:ring-ring flex cursor-pointer flex-col gap-1.5 border-b p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset',
                selected && 'bg-accent border-l-primary border-l-2',
                r.workflow_status === 'new' && !selected && 'bg-status-sent-bg/20'
              )}
            >
              <div className='flex items-center gap-2'>
                <PlatformIcon platformId={r.platform_id} />
                <span className='truncate text-xs font-medium'>{r.location_name}</span>
                <span className='text-muted-foreground ml-auto shrink-0 text-xs'>
                  <time dateTime={r.published_at}>
                    {format.relativeTime(new Date(r.published_at), now)}
                  </time>
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <RatingStars rating={r.rating} />
                <span className='truncate text-xs'>{r.author.name}</span>
                {r.platform_state === 'edited' && (
                  <Badge variant='outline' className='text-status-action h-4 px-1 text-[10px]'>
                    {t('edited')}
                  </Badge>
                )}
                {r.platform_state === 'deleted_by_author' && (
                  <Badge variant='outline' className='text-muted-foreground h-4 px-1 text-[10px]'>
                    {t('deleted')}
                  </Badge>
                )}
                {r.platform_state === 'removed_by_platform' && (
                  <Badge variant='outline' className='text-status-error h-4 px-1 text-[10px]'>
                    {t('removed')}
                  </Badge>
                )}
              </div>
              <p
                className={cn(
                  'line-clamp-2 text-xs leading-snug',
                  !r.text && 'text-muted-foreground italic'
                )}
              >
                {r.text ?? t('noText')}
              </p>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className={cn(
                    'h-5 text-[10px]',
                    r.workflow_status === 'new' && 'text-status-sent',
                    r.workflow_status === 'resolved' && 'text-status-synced',
                    r.workflow_status === 'escalated' && 'text-status-error'
                  )}
                >
                  {tw(r.workflow_status)}
                </Badge>
                {r.has_published_reply && (
                  <Icons.checks className='text-status-synced size-3.5' aria-hidden />
                )}
                {r.note_count > 0 && (
                  <span className='text-muted-foreground inline-flex items-center gap-0.5 text-[10px]'>
                    <Icons.post className='size-3' /> {r.note_count}
                  </span>
                )}
                <span className='ml-auto'>
                  {assignee ? (
                    <Avatar className='size-5' title={assignee.name}>
                      {assignee.avatar && <AvatarImage src={assignee.avatar} alt='' />}
                      <AvatarFallback className='text-[9px]'>
                        {initials(assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className='text-muted-foreground text-[10px]'>{t('unassigned')}</span>
                  )}
                </span>
              </div>
            </button>
          );
        })}
        {hasNextPage && (
          <div className='p-3'>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <Icons.spinner className='size-4 animate-spin' />
              ) : (
                <Icons.chevronDown className='size-4' />
              )}
              {isFetchingNextPage ? t('loading') : t('loadMore')}
            </Button>
          </div>
        )}
      </div>
      {typeof total === 'number' && (
        <div className='text-muted-foreground border-t px-3 py-1.5 text-[11px]'>
          {t('count', { count: total })}
        </div>
      )}
    </div>
  );
}
