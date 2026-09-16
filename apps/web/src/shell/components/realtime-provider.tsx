'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Schema } from '@lp/contracts';
import { sessionKeys } from '@/features/session';
import { useScope } from '@/hooks/use-scope';

type ReviewStreamEvent = Schema<'ReviewStreamEvent'>;

interface RealtimeState {
  connected: boolean;
  /** Review events received since the consumer last called `ack()`. */
  pending: ReviewStreamEvent[];
  ack: () => void;
}

const RealtimeContext = createContext<RealtimeState | null>(null);

/**
 * Subscribes to `GET /api/core/reviews/stream?scope=` (SDD-01 §5.2) and invalidates review lists,
 * badges and notifications. Consumers (inbox «N новых») read `pending` and `ack()`.
 * Query keys of other features are invalidated by prefix (`['reviews']`, `['notifications']`) so
 * the shell does not depend on those features.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [scope] = useScope();
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState<ReviewStreamEvent[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const source = new EventSource(`/api/core/reviews/stream?scope=${encodeURIComponent(scope)}`);
    source.addEventListener('open', () => setConnected(true));
    source.addEventListener('error', () => setConnected(false));
    const onEvent = (event: MessageEvent<string>) => {
      let data: ReviewStreamEvent | null = null;
      try {
        data = JSON.parse(event.data) as ReviewStreamEvent;
      } catch {
        return;
      }
      if (!data) return;
      setPending((prev) => [...prev, data]);
      // Debounce invalidations: bursts of events → one refetch.
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: sessionKeys.badges(scope) });
        void queryClient.invalidateQueries({ queryKey: ['reviews', 'summary'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }, 800);
    };
    for (const type of [
      'review.ingested',
      'review.updated',
      'review.removed',
      'review.reply.changed'
    ])
      source.addEventListener(type, onEvent as EventListener);
    return () => {
      source.close();
      setConnected(false);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [scope, queryClient]);

  const value = useMemo<RealtimeState>(
    () => ({ connected, pending, ack: () => setPending([]) }),
    [connected, pending]
  );
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeState {
  const ctx = useContext(RealtimeContext);
  if (!ctx) return { connected: false, pending: [], ack: () => {} };
  return ctx;
}
