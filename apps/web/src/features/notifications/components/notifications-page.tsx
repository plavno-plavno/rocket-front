'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { badgesQueryOptions } from '@/features/session';
import { useScope } from '@/hooks/use-scope';
import { cn } from '@/lib/utils';
import { markAllNotificationsReadMutation, markNotificationReadMutation } from '../api/mutations';
import { notificationsInfiniteQueryOptions, notificationsKeys } from '../api/queries';
import type { Notification } from '../api/types';

const TYPE_ICON: Record<Notification['type'], keyof typeof Icons> = {
  negative_review: 'star',
  unanswered_review: 'reviews',
  action_required: 'alertCircle',
  batch_finished: 'checks',
  account_issue: 'sources',
  system: 'info'
};

const TYPE_TONE: Record<Notification['type'], string> = {
  negative_review: 'text-rating-negative',
  unanswered_review: 'text-status-sent',
  action_required: 'text-status-action',
  batch_finished: 'text-status-synced',
  account_issue: 'text-status-error',
  system: 'text-muted-foreground'
};

const WEEK = 7 * 86_400_000;

/** S-NOT-01 «Уведомления»: cursor feed with «Загрузить ещё», unread tab, type icons, link to channel settings. */
export default function NotificationsPage() {
  const t = useTranslations('notifications.page');
  const tt = useTranslations('notifications.types');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scope] = useScope();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const query = useInfiniteQuery(
    notificationsInfiniteQueryOptions(tab === 'unread' ? { 'filter[unread]': true } : {})
  );
  // Mutation options already invalidate the feed; the header badge lives in the session feature.
  const refreshBadges = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
      queryClient.invalidateQueries({ queryKey: badgesQueryOptions(scope).queryKey })
    ]);
  const markAll = useMutation({
    ...markAllNotificationsReadMutation(queryClient),
    onSuccess: refreshBadges
  });
  const markOne = useMutation({
    ...markNotificationReadMutation(queryClient),
    onSuccess: refreshBadges
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const unread = items.filter((n) => !n.read).length;

  const when = (iso: string) => {
    const d = new Date(iso);
    return now.getTime() - d.getTime() < WEEK
      ? format.relativeTime(d, now)
      : format.dateTime(d, 'medium');
  };

  const open = (n: Notification) => {
    if (!n.read) markOne.mutate({ id: n.id });
    if (n.link) router.push(n.link);
  };

  return (
    <PageContainer
      pageTitle={t('title')}
      pageDescription={t('description')}
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <LinkButton variant='ghost' size='sm' href='/dashboard/settings/notifications'>
            <Icons.settings className='size-4' /> {t('settings')}
          </LinkButton>
          <Button
            variant='outline'
            size='sm'
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || unread === 0}
            data-testid='notifications-mark-all'
          >
            <Icons.checks className='size-4' /> {t('markAll')}
          </Button>
        </div>
      }
    >
      <div className='flex flex-col gap-4' data-template='list' data-testid='notifications-page'>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value='all'>{t('all')}</TabsTrigger>
            <TabsTrigger value='unread'>{t('unread')}</TabsTrigger>
          </TabsList>
        </Tabs>
        {query.isPending ? (
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-16' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icons.notification />
              </EmptyMedia>
              <EmptyTitle>{tab === 'unread' ? t('emptyUnread') : t('empty')}</EmptyTitle>
              <EmptyDescription>{t('emptyHint')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className='divide-y rounded-lg border' data-testid='notifications-list'>
            {items.map((n) => {
              const Icon = Icons[TYPE_ICON[n.type]];
              return (
                <li
                  key={n.id}
                  className={cn('flex items-start gap-3 p-3', !n.read && 'bg-primary/5')}
                  data-read={n.read}
                >
                  <span
                    className={cn(
                      'bg-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                      TYPE_TONE[n.type]
                    )}
                    title={tt(`${n.type}.title`)}
                  >
                    <Icon className='size-4' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='flex items-center gap-2 text-sm font-medium'>
                      {!n.read && <span className='bg-primary size-1.5 rounded-full' aria-hidden />}
                      {n.link ? (
                        <button
                          type='button'
                          className='text-left underline-offset-4 hover:underline'
                          onClick={() => open(n)}
                        >
                          {n.title}
                        </button>
                      ) : (
                        n.title
                      )}
                    </p>
                    <p className='text-muted-foreground text-sm'>{n.body}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      <time dateTime={n.created_at}>{when(n.created_at)}</time>
                      <span className='mx-1'>·</span>
                      {tt(`${n.type}.title`)}
                    </p>
                  </div>
                  {n.link && (
                    <Button variant='outline' size='sm' onClick={() => open(n)}>
                      {t('open')}
                    </Button>
                  )}
                  {!n.read && (
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      onClick={() => markOne.mutate({ id: n.id })}
                      aria-label={t('markRead')}
                    >
                      <Icons.check className='size-4' />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {query.hasNextPage && (
          <div className='flex justify-center'>
            <Button
              variant='outline'
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              data-testid='notifications-more'
            >
              {query.isFetchingNextPage && <Icons.spinner className='size-4 animate-spin' />}
              {t('loadMore')}
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
