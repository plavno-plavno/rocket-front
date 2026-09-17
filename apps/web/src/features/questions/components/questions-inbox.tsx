'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LinkButton } from '@/components/ui/link-button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCan } from '@/features/session';
import { platformsQueryOptions } from '@/features/sources';
import { UserCombobox } from '@/features/users';
import { useDebounce } from '@/hooks/use-debounce';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { createAnswerMutation, updateQuestionMutation } from '../api/mutations';
import {
  answersQueryOptions,
  questionQueryOptions,
  questionsInfiniteQueryOptions,
  questionsKeys
} from '../api/queries';
import type { Question } from '../api/types';
import { QUESTION_STATUSES, questionsSearchParams, toQuestionsQuery } from '../searchparams';

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function useQuestionsInbox() {
  const [params, setParams] = useQueryStates(questionsSearchParams, { shallow: true });
  const [search, setSearch] = useState(params.q);
  const debounced = useDebounce(search.trim(), 400);
  useEffect(() => {
    if (debounced !== params.q) void setParams({ q: debounced || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  const query = useMemo(() => toQuestionsQuery(params), [params]);
  const list = useInfiniteQuery(questionsInfiniteQueryOptions(query));
  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const selectedId = params.question || null;
  const select = useCallback((id: string | null) => void setParams({ question: id }), [setParams]);
  useEffect(() => {
    if (!selectedId && items[0] && window.innerWidth >= 768) select(items[0].id);
  }, [items, selectedId, select]);
  return { params, setParams, search, setSearch, list, items, selectedId, select };
}

/** Left column: search + list. */
export function QuestionsList() {
  const t = useTranslations('questions.list');
  const tw = useTranslations('reviews.workflow');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const inbox = useQuestionsInbox();
  return (
    <div className='flex h-full flex-col' data-testid='questions-list'>
      <div className='border-b p-2'>
        <div className='relative'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={inbox.search}
            onChange={(e) => inbox.setSearch(e.target.value)}
            placeholder={t('search')}
            className='h-8 pl-8 text-sm'
            aria-label={t('search')}
          />
        </div>
      </div>
      <div className='flex-1 overflow-y-auto'>
        {inbox.list.isPending &&
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className='flex flex-col gap-2 border-b p-3'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-8 w-full' />
            </div>
          ))}
        {!inbox.list.isPending && inbox.items.length === 0 && (
          <Empty className='py-12'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icons.help />
              </EmptyMedia>
              <EmptyTitle>{t('empty')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
        {inbox.items.map((q) => (
          <button
            type='button'
            key={q.id}
            onClick={() => inbox.select(q.id)}
            aria-current={q.id === inbox.selectedId ? 'true' : undefined}
            className={cn(
              'hover:bg-muted/60 flex w-full flex-col gap-1 border-b p-3 text-left text-sm',
              q.id === inbox.selectedId && 'bg-accent border-l-primary border-l-2'
            )}
          >
            <div className='flex items-center gap-2'>
              <PlatformIcon platformId={q.platform_id} />
              <span className='truncate text-xs font-medium'>{q.location_name}</span>
              <span className='text-muted-foreground ml-auto shrink-0 text-xs'>
                <time dateTime={q.published_at}>
                  {format.relativeTime(new Date(q.published_at), now)}
                </time>
              </span>
            </div>
            <p className='line-clamp-2 text-xs leading-snug'>{q.text}</p>
            <div className='flex items-center gap-2'>
              <span className='text-xs'>{q.author.name}</span>
              <Badge
                variant='outline'
                className={cn(
                  'ml-auto h-5 text-[10px]',
                  q.workflow_status === 'new' && 'text-status-sent',
                  q.workflow_status === 'resolved' && 'text-status-synced'
                )}
              >
                {tw(q.workflow_status)}
              </Badge>
              <span className='text-muted-foreground text-[10px]'>
                {q.answer_count ? t('answers', { count: q.answer_count }) : t('noAnswer')}
              </span>
            </div>
          </button>
        ))}
        {inbox.list.hasNextPage && (
          <div className='p-3'>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              onClick={() => void inbox.list.fetchNextPage()}
              disabled={inbox.list.isFetchingNextPage}
            >
              {t('loadMore')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Centre column: question, status / assignee, answers, composer. */
export function QuestionDetail() {
  const t = useTranslations('questions.detail');
  const tl = useTranslations('questions.list');
  const tw = useTranslations('reviews.workflow');
  const format = useFormatter();
  const now = useNow({ updateInterval: 30_000 });
  const queryClient = useQueryClient();
  const canReply = useCan('reviews.reply');
  const [params] = useQueryStates(questionsSearchParams, { shallow: true });
  const id = params.question || null;
  const { data: question } = useQuery({ ...questionQueryOptions(id ?? ''), enabled: !!id });
  const { data: answers } = useQuery({
    ...answersQueryOptions(id ?? ''),
    enabled: !!id,
    refetchInterval: (q) =>
      q.state.data?.items.some((a) => a.state === 'requested') ? 1500 : false
  });
  const hasRequested = !!answers?.items.some((a) => a.state === 'requested');
  const prevRequested = useRef(false);
  useEffect(() => {
    if (prevRequested.current && !hasRequested)
      void queryClient.invalidateQueries({ queryKey: questionsKeys.all });
    prevRequested.current = hasRequested;
  }, [hasRequested, queryClient]);
  const { data: platforms } = useQuery(platformsQueryOptions());
  const update = useMutation(updateQuestionMutation(queryClient));
  const create = useMutation(createAnswerMutation(queryClient));
  const [text, setText] = useState('');

  if (!id) {
    return (
      <div className='text-muted-foreground flex h-full items-center justify-center p-8 text-sm'>
        {tl('selectHint')}
      </div>
    );
  }
  if (!question) {
    return (
      <div className='flex flex-col gap-3 p-4'>
        <Skeleton className='h-5 w-1/2' />
        <Skeleton className='h-20 w-full' />
      </div>
    );
  }
  const platform = platforms?.items.find((p) => p.id === question.platform_id);
  const patch = (
    body: { workflow_status?: Question['workflow_status']; assignee_user_id?: string | null },
    msg: string
  ) =>
    update.mutate(
      { id: question.id, body },
      { onSuccess: () => toast.success(msg), onError: (e) => toast.error(errorText(e)) }
    );

  return (
    <div className='flex h-full flex-col gap-4 overflow-y-auto p-4' data-testid='question-detail'>
      <div className='flex items-start gap-2'>
        <PlatformIcon
          platformId={question.platform_id}
          icon={platform?.icon}
          className='mt-0.5 size-5'
        />
        <div className='min-w-0 flex-1'>
          <div className='font-semibold'>{question.author.name}</div>
          <div className='text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs'>
            <LinkButton
              variant='link'
              size='sm'
              className='text-muted-foreground h-auto p-0 text-xs'
              href={`/dashboard/locations/${question.location_id}`}
            >
              {question.location_name}
            </LinkButton>
            <span>·</span>
            <time dateTime={question.published_at}>
              {format.dateTime(new Date(question.published_at), 'long')}
            </time>
          </div>
        </div>
        {question.url && (
          <LinkButton
            variant='ghost'
            size='icon-sm'
            href={question.url}
            target='_blank'
            rel='noreferrer'
            aria-label={t('openOnPlatform')}
          >
            <Icons.externalLink className='size-4' />
          </LinkButton>
        )}
      </div>
      <p className='text-sm leading-relaxed whitespace-pre-wrap'>{question.text}</p>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>{t('assignee')}</span>
          <UserCombobox
            value={question.assignee_user_id ?? null}
            onChange={(uid) => patch({ assignee_user_id: uid }, t('assigneeUpdated'))}
            disabled={!canReply}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>{t('status')}</span>
          <Select
            value={question.workflow_status}
            onValueChange={(v) =>
              v && patch({ workflow_status: v as Question['workflow_status'] }, t('statusUpdated'))
            }
            disabled={!canReply}
          >
            <SelectTrigger size='sm' aria-label={t('status')}>
              <SelectValue>{(v: Question['workflow_status']) => tw(v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {QUESTION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {tw(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <h4 className='text-sm font-medium'>
          {t('answers', { count: answers?.items.length ?? question.answer_count })}
        </h4>
        {answers?.items.length ? (
          answers.items.map((a) => (
            <div
              key={a.id}
              className='rounded-md border p-3 text-sm'
              data-testid='answer'
              data-state={a.state}
            >
              <div className='text-muted-foreground mb-1 flex items-center gap-2 text-xs'>
                <Badge
                  variant='outline'
                  className={cn(
                    'h-4 px-1 text-[10px]',
                    a.state === 'published' && 'text-status-synced',
                    a.state === 'requested' && 'text-status-sent'
                  )}
                >
                  {a.state === 'requested' && (
                    <Icons.spinner className='mr-1 size-3 animate-spin' />
                  )}
                  {t(`state.${a.state}`)}
                </Badge>
                {a.published_at && (
                  <time dateTime={a.published_at}>
                    {format.relativeTime(new Date(a.published_at), now)}
                  </time>
                )}
              </div>
              <p className='whitespace-pre-wrap'>{a.text}</p>
            </div>
          ))
        ) : (
          <p className='text-muted-foreground text-xs'>{t('noAnswers')}</p>
        )}
      </div>
      {canReply && (
        <div className='flex flex-col gap-2'>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('placeholder')}
            rows={4}
            aria-label={t('placeholder')}
          />
          <Button
            size='sm'
            className='self-end'
            disabled={!text.trim() || create.isPending}
            data-testid='publish-answer'
            onClick={() =>
              create.mutate(
                { id: question.id, body: { text: text.trim() } },
                {
                  onSuccess: () => {
                    setText('');
                    toast.success(t('published'));
                  },
                  onError: (e) => toast.error(errorText(e))
                }
              )
            }
          >
            <Icons.send className='size-4' /> {t('publish')}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Right column (pinned ≥ 1536px) and the Sheet on narrower screens. */
export function QuestionsFiltersPanel({ className }: { className?: string }) {
  const t = useTranslations('questions.filters');
  const tw = useTranslations('reviews.workflow');
  const [params, setParams] = useQueryStates(questionsSearchParams, { shallow: true });
  const { data: platforms } = useQuery(platformsQueryOptions());
  const active =
    params.platform.length + params.status.length + (params.hasAnswer === null ? 0 : 1);
  const toggle = (key: 'platform' | 'status', value: string, on: boolean) => {
    const list = params[key] as string[];
    void setParams({ [key]: on ? [...list, value] : list.filter((x) => x !== value) } as never);
  };
  const current = params.hasAnswer === null ? 'any' : params.hasAnswer ? 'yes' : 'no';
  return (
    <div className={cn('flex h-full flex-col', className)} data-testid='questions-filters'>
      <div className='flex items-center justify-between border-b px-3 py-2'>
        <span className='text-sm font-semibold'>{t('title')}</span>
        <Button
          variant='ghost'
          size='sm'
          disabled={!active}
          onClick={() => void setParams({ platform: null, status: null, hasAnswer: null })}
        >
          {t('clear')}
        </Button>
      </div>
      <ScrollArea className='flex-1'>
        <div className='flex flex-col gap-5 p-3'>
          <fieldset className='flex flex-col gap-1.5'>
            <legend className='text-muted-foreground mb-1.5 text-xs font-medium uppercase'>
              {t('hasAnswer')}
            </legend>
            <ToggleGroup
              value={[current]}
              onValueChange={(v) => {
                const next = (Array.isArray(v) ? v[0] : v) as string | undefined;
                void setParams({ hasAnswer: next === 'yes' ? true : next === 'no' ? false : null });
              }}
              className='w-full'
            >
              <ToggleGroupItem value='any' size='sm' className='flex-1 text-xs'>
                {t('any')}
              </ToggleGroupItem>
              <ToggleGroupItem value='yes' size='sm' className='flex-1 text-xs'>
                {t('yes')}
              </ToggleGroupItem>
              <ToggleGroupItem value='no' size='sm' className='flex-1 text-xs'>
                {t('no')}
              </ToggleGroupItem>
            </ToggleGroup>
          </fieldset>
          <fieldset className='flex flex-col gap-1.5'>
            <legend className='text-muted-foreground mb-1.5 text-xs font-medium uppercase'>
              {t('status')}
            </legend>
            {QUESTION_STATUSES.map((s) => (
              <div key={s} className='flex items-center gap-2'>
                <Checkbox
                  id={`q-status-${s}`}
                  checked={params.status.includes(s)}
                  onCheckedChange={(v) => toggle('status', s, !!v)}
                />
                <Label htmlFor={`q-status-${s}`} className='cursor-pointer text-sm font-normal'>
                  {tw(s)}
                </Label>
              </div>
            ))}
          </fieldset>
          <fieldset className='flex flex-col gap-1.5'>
            <legend className='text-muted-foreground mb-1.5 text-xs font-medium uppercase'>
              {t('platform')}
            </legend>
            {(platforms?.items ?? []).map((p) => (
              <div key={p.id} className='flex items-center gap-2'>
                <Checkbox
                  id={`q-platform-${p.id}`}
                  checked={params.platform.includes(p.id)}
                  onCheckedChange={(v) => toggle('platform', p.id, !!v)}
                />
                <Label
                  htmlFor={`q-platform-${p.id}`}
                  className='cursor-pointer text-sm font-normal'
                >
                  {p.name}
                </Label>
              </div>
            ))}
          </fieldset>
        </div>
      </ScrollArea>
    </div>
  );
}

export function QuestionsFiltersSheet() {
  const t = useTranslations('questions.filters');
  return (
    <Sheet>
      <SheetTrigger render={<Button variant='outline' size='sm' className='2xl:hidden' />}>
        <Icons.adjustments className='size-4' /> {t('title')}
      </SheetTrigger>
      <SheetContent className='w-full p-0 sm:max-w-sm'>
        <SheetHeader className='sr-only'>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('title')}</SheetDescription>
        </SheetHeader>
        <QuestionsFiltersPanel className='h-full' />
      </SheetContent>
    </Sheet>
  );
}
