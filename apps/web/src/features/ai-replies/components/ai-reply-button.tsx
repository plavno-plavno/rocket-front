'use client';

import { useCompletion } from '@ai-sdk/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

export interface AiReplyButtonProps {
  reviewId: string;
  /** Called with partial text while streaming and the final text at the end. */
  onStream: (text: string, done: boolean) => void;
  profileId?: string | null;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

/**
 * «Сгенерировать ИИ» (SDD-01T §3.5, [H-UI-10]): streams the UI message stream of
 * `POST /api/ai/reply` (route handler → core-api `/ai-replies/generate`) via AI SDK `useCompletion`.
 */
export function AiReplyButton({
  reviewId,
  onStream,
  profileId,
  disabled,
  size = 'sm'
}: AiReplyButtonProps) {
  const t = useTranslations('ai-replies.button');
  const onStreamRef = useRef(onStream);
  onStreamRef.current = onStream;
  const { completion, complete, isLoading, stop } = useCompletion({
    api: '/api/ai/reply',
    body: { review_id: reviewId, profile_id: profileId ?? null },
    onFinish: (_prompt, text) => onStreamRef.current(text, true),
    onError: (e) => toast.error(e.message || t('error'))
  });

  useEffect(() => {
    if (isLoading && completion) onStreamRef.current(completion, false);
  }, [completion, isLoading]);

  return (
    <Button
      variant='outline'
      size={size}
      onClick={() => (isLoading ? stop() : void complete(''))}
      disabled={disabled}
      aria-busy={isLoading}
      data-testid='ai-reply-button'
    >
      {isLoading ? (
        <Icons.spinner className='size-4 animate-spin' />
      ) : (
        <Icons.sparkles className='size-4' />
      )}
      {isLoading ? t('stop') : t('generate')}
    </Button>
  );
}
