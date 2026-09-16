'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { markAllNotificationsReadMutation, markNotificationReadMutation } from '../api/mutations';
import { notificationsQueryOptions } from '../api/queries';

/** S-NOT-01 minimal list (Foundation); UI-F7 adds pagination, channel settings and richer cards. */
export default function NotificationsPage() {
  const t = useTranslations('notifications.page');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const { data, isPending } = useQuery(
    notificationsQueryOptions({
      limit: 50,
      ...(tab === 'unread' ? { 'filter[unread]': true } : {})
    })
  );
  const markAll = useMutation(markAllNotificationsReadMutation(queryClient));
  const markOne = useMutation(markNotificationReadMutation(queryClient));
  const items = data?.items ?? [];

  return (
    <PageContainer
      pageTitle={t('title')}
      pageDescription={t('description')}
      pageHeaderAction={
        <Button
          variant='outline'
          size='sm'
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending}
        >
          <Icons.check className='size-4' /> {t('markAll')}
        </Button>
      }
    >
      <div className='flex flex-col gap-4' data-template='list'>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value='all'>{t('all')}</TabsTrigger>
            <TabsTrigger value='unread'>{t('unread')}</TabsTrigger>
          </TabsList>
        </Tabs>
        {isPending ? (
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
              <EmptyTitle>{t('empty')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {items.map((n) => (
              <li
                key={n.id}
                className={cn('flex items-start gap-3 p-3', !n.read && 'bg-primary/5')}
              >
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium'>{n.title}</p>
                  <p className='text-muted-foreground text-sm'>{n.body}</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {format.dateTime(new Date(n.created_at), 'long')}
                  </p>
                </div>
                {n.link && (
                  <LinkButton
                    variant='outline'
                    size='sm'
                    href={n.link}
                    onClick={() => !n.read && markOne.mutate({ id: n.id })}
                  >
                    {t('open')}
                  </LinkButton>
                )}
                {!n.read && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => markOne.mutate({ id: n.id })}
                    aria-label={t('markRead')}
                  >
                    <Icons.check className='size-4' />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
