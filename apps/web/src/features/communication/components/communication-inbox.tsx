'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Label } from '@/components/ui/label';
import { LinkButton } from '@/components/ui/link-button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/features/session';
import { platformsQueryOptions } from '@/features/sources';
import { UserCombobox } from '@/features/users';
import { useScope } from '@/hooks/use-scope';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { sendConversationMessageMutation, updateConversationMutation } from '../api/mutations';
import {
  communicationKeys,
  conversationMessagesQueryOptions,
  conversationQueryOptions,
  conversationsInfiniteQueryOptions
} from '../api/queries';
import type { Conversation } from '../api/types';

export const communicationParams = {
  conversation: parseAsString.withDefault(''),
  q: parseAsString.withDefault(''),
  platform: parseAsString.withDefault(''),
  status: parseAsStringLiteral(['open', 'closed', 'all'] as const).withDefault('open')
};

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function useParams() {
  return useQueryStates(communicationParams, { shallow: true });
}

/** Left column: searchable thread list with unread badges, cursor «Загрузить ещё». */
export function ConversationsList() {
  const t = useTranslations('communication.list');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [scope] = useScope();
  const [p, setP] = useParams();
  const { data: platforms } = useQuery(platformsQueryOptions());
  const query = useInfiniteQuery(
    conversationsInfiniteQueryOptions({
      scope: scope ?? 'all',
      ...(p.q ? { q: p.q } : {}),
      ...(p.platform ? { 'filter[platform_id]': [p.platform] } : {}),
      ...(p.status !== 'all' ? { 'filter[status]': p.status } : {})
    })
  );
  const items = query.data?.pages.flatMap((x) => x.items) ?? [];
  return (
    <div className='flex h-full flex-col' data-testid='conversations-list'>
      <div className='relative border-b p-2'>
        <Icons.search className='text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2' />
        <Input
          value={p.q}
          onChange={(e) => setP({ q: e.target.value })}
          placeholder={t('search')}
          className='h-8 pl-8'
          aria-label={t('search')}
        />
      </div>
      <div className='flex-1 overflow-y-auto'>
        {query.isPending ? (
          <div className='flex flex-col gap-2 p-2'>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className='h-14' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Empty className='py-10'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icons.chat />
              </EmptyMedia>
              <EmptyTitle>{t('empty')}</EmptyTitle>
              <EmptyDescription>{t('emptyHint')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className='divide-y'>
            {items.map((c) => (
              <li key={c.id}>
                <button
                  type='button'
                  onClick={() => setP({ conversation: c.id })}
                  data-conversation={c.id}
                  aria-label={`${c.contact_name} · ${c.location_name ?? ''}`}
                  className={cn(
                    'hover:bg-accent/50 flex w-full items-start gap-3 px-3 py-2.5 text-left',
                    p.conversation === c.id && 'bg-accent'
                  )}
                >
                  <Avatar className='size-9'>
                    <AvatarFallback className='text-xs'>{initials(c.contact_name)}</AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={cn('truncate text-sm', c.unread_count > 0 && 'font-semibold')}
                      >
                        {c.contact_name}
                      </span>
                      <PlatformIcon
                        platformId={c.platform_id}
                        icon={platforms?.items.find((x) => x.id === c.platform_id)?.icon ?? null}
                        className='size-3.5'
                      />
                      <span className='text-muted-foreground ml-auto shrink-0 text-[11px]'>
                        {format.relativeTime(new Date(c.last_message_at), now)}
                      </span>
                    </div>
                    <div className='text-muted-foreground truncate text-xs'>{c.location_name}</div>
                    <div className='flex items-center gap-2'>
                      <span className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>
                        {c.last_message_preview ?? ''}
                      </span>
                      {c.unread_count > 0 && (
                        <span className='bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] font-medium'>
                          {c.unread_count}
                        </span>
                      )}
                      {c.status === 'closed' && (
                        <Icons.circleCheck
                          className='text-muted-foreground size-3.5'
                          aria-label={t('closed')}
                        />
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.hasNextPage && (
          <div className='p-2'>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {t('more')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Centre column: thread header (contact, platform, location, assignee, close), messages, composer. */
export function ConversationDetail() {
  const t = useTranslations('communication.detail');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const canReply = useCan('reviews.reply');
  const [p] = useParams();
  const id = p.conversation;
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data: conversation, isPending } = useQuery({
    ...conversationQueryOptions(id),
    enabled: !!id
  });
  const { data: messages } = useQuery({
    ...conversationMessagesQueryOptions(id, { limit: 100 }),
    enabled: !!id,
    refetchInterval: 15_000
  });
  const update = useMutation(updateConversationMutation(queryClient));
  const send = useMutation(sendConversationMessageMutation(queryClient));
  const [text, setText] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages?.items.length, id]);
  useEffect(() => setText(''), [id]);

  if (!id) {
    return (
      <Empty className='h-full'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.chat />
          </EmptyMedia>
          <EmptyTitle>{t('pick')}</EmptyTitle>
          <EmptyDescription>{t('pickHint')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  if (isPending || !conversation) return <Skeleton className='m-4 h-96' />;

  const platform = platforms?.items.find((x) => x.id === conversation.platform_id);
  const patch = (
    body: { status?: Conversation['status']; assignee_user_id?: string | null },
    done: string
  ) =>
    update.mutate(
      { id: conversation.id, body },
      { onSuccess: () => toast.success(done), onError: (e) => toast.error(errorText(e)) }
    );
  const submit = () => {
    if (!text.trim()) return;
    send.mutate(
      { id: conversation.id, body: { text: text.trim() } },
      {
        onSuccess: () => {
          setText('');
          void queryClient.invalidateQueries({ queryKey: communicationKeys.all });
        },
        onError: (e) => toast.error(errorText(e))
      }
    );
  };

  return (
    <div className='flex h-full flex-col' data-testid='conversation-detail'>
      <header className='flex flex-wrap items-center gap-3 border-b p-3'>
        <Avatar className='size-9'>
          <AvatarFallback className='text-xs'>{initials(conversation.contact_name)}</AvatarFallback>
        </Avatar>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 font-medium'>
            {conversation.contact_name}
            <Badge variant='outline' className='gap-1'>
              <PlatformIcon
                platformId={conversation.platform_id}
                icon={platform?.icon ?? null}
                className='size-3.5'
              />
              {platform?.name ?? conversation.platform_id}
            </Badge>
            {conversation.status === 'closed' && <Badge variant='secondary'>{t('closed')}</Badge>}
          </div>
          <LinkButton
            href={`/dashboard/locations/${conversation.location_id}`}
            variant='link'
            size='sm'
            className='h-auto p-0 text-xs'
          >
            {conversation.location_name}
          </LinkButton>
        </div>
        {canReply && (
          <div className='flex items-center gap-2'>
            <UserCombobox
              value={conversation.assignee_user_id ?? null}
              onChange={(userId) => patch({ assignee_user_id: userId }, t('assigned'))}
              className='h-8 w-48'
            />
            {conversation.status === 'open' ? (
              <Button
                size='sm'
                variant='outline'
                onClick={() => patch({ status: 'closed' }, t('closedDone'))}
                data-testid='conversation-close'
              >
                <Icons.check className='size-4' /> {t('close')}
              </Button>
            ) : (
              <Button
                size='sm'
                variant='outline'
                onClick={() => patch({ status: 'open' }, t('reopened'))}
                data-testid='conversation-reopen'
              >
                <Icons.refresh className='size-4' /> {t('reopen')}
              </Button>
            )}
          </div>
        )}
      </header>
      <div className='flex-1 overflow-y-auto p-4' data-testid='conversation-messages'>
        <ul className='flex flex-col gap-3'>
          {(messages?.items ?? []).map((m) => (
            <li
              key={m.id}
              className={cn('flex', m.direction === 'outbound' ? 'justify-end' : 'justify-start')}
              data-direction={m.direction}
            >
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                  m.direction === 'outbound'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                )}
              >
                <p className='whitespace-pre-wrap'>{m.text}</p>
                <p
                  className={cn(
                    'mt-1 text-[10px]',
                    m.direction === 'outbound'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  {format.dateTime(new Date(m.sent_at), 'time')}
                  {m.state === 'failed' && ` · ${t('failed')}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div ref={bottom} />
      </div>
      {canReply && conversation.status === 'open' && (
        <form
          className='flex items-end gap-2 border-t p-3'
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
            }}
            rows={2}
            placeholder={t('placeholder')}
            aria-label={t('message')}
            className='min-h-10 flex-1 resize-none'
            data-testid='conversation-input'
          />
          <Button
            type='submit'
            disabled={send.isPending || !text.trim()}
            data-testid='conversation-send'
          >
            {send.isPending ? (
              <Icons.spinner className='size-4 animate-spin' />
            ) : (
              <Icons.send className='size-4' />
            )}
            {t('send')}
          </Button>
        </form>
      )}
    </div>
  );
}

/** Right column (pinned ≥ 1536px): status and platform filters. */
export function ConversationsFiltersPanel() {
  const t = useTranslations('communication.filters');
  const [p, setP] = useParams();
  const { data: platforms } = useQuery(platformsQueryOptions());
  return (
    <div className='flex flex-col gap-5 p-3' data-testid='conversations-filters'>
      <div className='flex flex-col gap-2'>
        <Label>{t('status')}</Label>
        <RadioGroup
          value={p.status}
          onValueChange={(v) =>
            setP({ status: (v as typeof p.status) ?? 'open', conversation: '' })
          }
          className='flex flex-col gap-1.5'
        >
          {(['open', 'closed', 'all'] as const).map((s) => (
            <Label key={s} className='flex items-center gap-2 font-normal'>
              <RadioGroupItem value={s} /> {t(`statuses.${s}`)}
            </Label>
          ))}
        </RadioGroup>
      </div>
      <div className='flex flex-col gap-2'>
        <Label>{t('platform')}</Label>
        <RadioGroup
          value={p.platform || '__all__'}
          onValueChange={(v) =>
            setP({ platform: !v || v === '__all__' ? '' : v, conversation: '' })
          }
          className='flex flex-col gap-1.5'
        >
          <Label className='flex items-center gap-2 font-normal'>
            <RadioGroupItem value='__all__' /> {t('allPlatforms')}
          </Label>
          {(platforms?.items ?? [])
            .filter((x) => x.capabilities.questions?.answer)
            .map((x) => (
              <Label key={x.id} className='flex items-center gap-2 font-normal'>
                <RadioGroupItem value={x.id} />
                <PlatformIcon platformId={x.id} icon={x.icon} className='size-3.5' /> {x.name}
              </Label>
            ))}
        </RadioGroup>
      </div>
    </div>
  );
}

/** Filters as a Sheet below 1536px (header action). */
export function ConversationsFiltersSheet() {
  const t = useTranslations('communication.filters');
  return (
    <Sheet>
      <SheetTrigger render={<Button variant='outline' size='sm' className='2xl:hidden' />}>
        <Icons.adjustments className='size-4' /> {t('title')}
      </SheetTrigger>
      <SheetContent className='w-80 p-0'>
        <SheetHeader className='border-b'>
          <SheetTitle>{t('title')}</SheetTitle>
        </SheetHeader>
        <ConversationsFiltersPanel />
      </SheetContent>
    </Sheet>
  );
}
