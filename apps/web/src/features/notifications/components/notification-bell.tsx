'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { badgesQueryOptions } from '@/features/session';
import { useScope } from '@/hooks/use-scope';
import { cn } from '@/lib/utils';
import { markAllNotificationsReadMutation, markNotificationReadMutation } from '../api/mutations';
import { notificationsKeys, notificationsQueryOptions } from '../api/queries';

const MAX_VISIBLE = 6;

/** Public (SDD-01T §3.5): header bell with unread badge + popover of the latest notifications. */
export function NotificationBell() {
  const t = useTranslations('notifications.bell');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scope] = useScope();
  const { data: badges } = useQuery(badgesQueryOptions(scope));
  const { data } = useQuery({
    ...notificationsQueryOptions({ limit: MAX_VISIBLE }),
    staleTime: 30_000
  });
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
      queryClient.invalidateQueries({ queryKey: badgesQueryOptions(scope).queryKey })
    ]);
  const markAll = useMutation({
    ...markAllNotificationsReadMutation(queryClient),
    onSuccess: refresh
  });
  const markOne = useMutation({ ...markNotificationReadMutation(queryClient), onSuccess: refresh });
  const count = badges?.notifications_unread ?? 0;
  const items = data?.items ?? [];

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='relative size-8'
            aria-label={t('label', { count })}
          />
        }
      >
        <Icons.notification className='size-4' />
        {count > 0 && (
          <span
            className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'
            aria-hidden
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='flex w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:w-96'
        sideOffset={8}
      >
        <div className='flex shrink-0 items-center justify-between px-3 py-2'>
          <span className='text-sm font-medium'>{t('title')}</span>
          <Button
            variant='ghost'
            size='sm'
            className='h-7 text-xs'
            disabled={!count || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            {t('markAll')}
          </Button>
        </div>
        <Separator />
        {/* A plain scroll box: ScrollArea capped only by max-height let the list spill under the footer. */}
        <div className='max-h-[min(24rem,55dvh)] min-h-0 overflow-y-auto overscroll-contain'>
          {items.length === 0 ? (
            <p className='text-muted-foreground p-6 text-center text-sm'>{t('empty')}</p>
          ) : (
            <ul className='divide-y'>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type='button'
                    className={cn(
                      'hover:bg-accent/50 flex w-full flex-col gap-0.5 px-3 py-2 text-left',
                      !n.read && 'bg-primary/5'
                    )}
                    onClick={() => {
                      if (!n.read) markOne.mutate({ id: n.id });
                      if (n.link) router.push(n.link);
                    }}
                  >
                    <span className='flex items-center gap-2 text-sm font-medium'>
                      {!n.read && <span className='bg-primary size-1.5 rounded-full' aria-hidden />}
                      {n.title}
                    </span>
                    <span className='text-muted-foreground line-clamp-2 text-xs'>{n.body}</span>
                    <span className='text-muted-foreground text-[11px]'>
                      {format.relativeTime(new Date(n.created_at), now)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Separator />
        <div className='shrink-0 p-2'>
          <LinkButton variant='ghost' size='sm' className='w-full' href='/dashboard/notifications'>
            {t('all')}
          </LinkButton>
        </div>
      </PopoverContent>
    </Popover>
  );
}
