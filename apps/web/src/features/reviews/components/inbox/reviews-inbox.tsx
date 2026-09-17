'use client';

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { usersQueryOptions } from '@/features/users';
import { useDebounce } from '@/hooks/use-debounce';
import { useRealtime } from '@/shell';
import { reviewsInfiniteQueryOptions, reviewsKeys } from '../../api/queries';
import { reviewsSearchParams, toReviewsQuery } from '../../searchparams';
import { ReviewDetail, type ReviewDetailHandle } from '../review-detail';
import { ReviewList } from './review-list';

const PAGE = 50;

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ||
    el.closest('[role="dialog"],[role="menu"],[role="listbox"],[cmdk-root]') !== null
  );
}

/** Shared list state of the inbox (used by the list column and the detail column). */
export function useReviewsInbox() {
  const [params, setParams] = useQueryStates(reviewsSearchParams, { shallow: true });
  const [search, setSearch] = useState(params.q);
  const debounced = useDebounce(search.trim(), 400);
  useEffect(() => {
    if (debounced !== params.q) void setParams({ q: debounced || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = useMemo(() => toReviewsQuery(params), [params]);
  const list = useInfiniteQuery(reviewsInfiniteQueryOptions(query, PAGE));
  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const selectedId = params.review || null;
  const select = useCallback((id: string | null) => void setParams({ review: id }), [setParams]);

  // Auto-select the first item on desktop when nothing is selected.
  useEffect(() => {
    if (!selectedId && items[0] && window.innerWidth >= 768) select(items[0].id);
  }, [items, selectedId, select]);

  // When the filters change, the selection follows the new result: a review that is no longer in
  // the list is replaced by the first one (desktop) or cleared. Otherwise the detail kept showing a
  // review next to «Отзывов по этим условиям нет». A deep link (first load) is left alone.
  const queryKey = JSON.stringify(query);
  const settledKey = useRef<string | null>(null);
  useEffect(() => {
    if (list.isPending || list.isPlaceholderData) return;
    const changed = settledKey.current !== null && settledKey.current !== queryKey;
    settledKey.current = queryKey;
    if (!changed || (selectedId && items.some((r) => r.id === selectedId))) return;
    select(items[0] && window.innerWidth >= 768 ? items[0].id : null);
  }, [queryKey, list.isPending, list.isPlaceholderData, items, selectedId, select]);

  // Same loading language in every column: old content stays, dimmed, until the new result arrives.
  const refreshing =
    list.isPlaceholderData || (list.isFetching && !list.isFetchingNextPage && !list.isPending);

  return { params, setParams, search, setSearch, list, items, selectedId, select, refreshing };
}

/** S-REV-01: list | detail with hotkeys (j/k/r/t/a) and the SSE «N новых» banner. */
export function ReviewsInbox({ column }: { column: 'list' | 'detail' }) {
  const t = useTranslations('reviews.list');
  const inbox = useReviewsInbox();
  const queryClient = useQueryClient();
  const { pending, ack } = useRealtime();
  const { data: users } = useQuery(usersQueryOptions());
  const detailRef = useRef<ReviewDetailHandle>(null);
  const userMap = useMemo(
    () =>
      new Map(
        (users?.items ?? []).map((m) => [
          m.user.id,
          { name: m.user.name, avatar: m.user.avatar_url }
        ])
      ),
    [users]
  );
  const newCount = pending.filter((e) => e.type === 'review.ingested').length;

  const showNew = () => {
    ack();
    void queryClient.invalidateQueries({ queryKey: reviewsKeys.all });
    void inbox.list.refetch();
  };

  // Hotkeys (SCR-3): j/k navigate, r reply, t tags, a assignee.
  const { items, selectedId, select } = inbox;
  useEffect(() => {
    if (column !== 'list') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const idx = items.findIndex((r) => r.id === selectedId);
      switch (e.key.toLowerCase()) {
        case 'j':
          if (items[idx + 1]) select(items[idx + 1]!.id);
          break;
        case 'k':
          if (idx > 0) select(items[idx - 1]!.id);
          break;
        case 'r':
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('lp:review-hotkey', { detail: 'reply' }));
          break;
        case 't':
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('lp:review-hotkey', { detail: 'tags' }));
          break;
        case 'a':
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('lp:review-hotkey', { detail: 'assignee' }));
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [column, items, selectedId, select]);

  useEffect(() => {
    if (column !== 'detail') return;
    const onHotkey = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      if (action === 'reply') detailRef.current?.focusReply();
      if (action === 'tags') detailRef.current?.openTags();
      if (action === 'assignee') detailRef.current?.openAssignee();
    };
    document.addEventListener('lp:review-hotkey', onHotkey);
    return () => document.removeEventListener('lp:review-hotkey', onHotkey);
  }, [column]);

  if (column === 'list') {
    return (
      <div className='flex h-full flex-col'>
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
        <div className='min-h-0 flex-1'>
          <ReviewList
            items={items}
            selectedId={selectedId}
            onSelect={select}
            isPending={inbox.list.isPending}
            refreshing={inbox.refreshing}
            hasNextPage={!!inbox.list.hasNextPage}
            isFetchingNextPage={inbox.list.isFetchingNextPage}
            onLoadMore={() => void inbox.list.fetchNextPage()}
            newCount={newCount}
            onShowNew={showNew}
            users={userMap}
          />
        </div>
      </div>
    );
  }

  if (!selectedId) {
    // Empty result: the list already explains it, the detail column stays quiet.
    const empty = !inbox.list.isPending && items.length === 0;
    return (
      <div
        className='text-muted-foreground flex h-full items-center justify-center p-8 text-sm'
        data-testid={empty ? 'review-detail-empty' : undefined}
      >
        {empty ? <Icons.chat className='size-8 opacity-30' aria-hidden /> : t('selectHint')}
      </div>
    );
  }
  return (
    <div
      className='h-full transition-opacity duration-200 aria-busy:opacity-60'
      aria-busy={inbox.refreshing || undefined}
    >
      <ReviewDetail key={selectedId} ref={detailRef} reviewId={selectedId} />
    </div>
  );
}
