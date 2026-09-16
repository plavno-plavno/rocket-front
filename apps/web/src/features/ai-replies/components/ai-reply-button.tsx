'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { generateAiReply } from '../api/service';

export interface AiReplyButtonProps {
  reviewId: string;
  /** Called with partial text while streaming and the final text at the end. */
  onStream: (text: string, done: boolean) => void;
  profileId?: string | null;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

/**
 * Public stub (SDD-01T §3.5): «Сгенерировать ИИ». Foundation version requests one variant as JSON
 * and emits it word by word to exercise the streaming contract of consumers; UI-F3 swaps in the
 * AI SDK stream from `/ai-replies/generate` [H-UI-10].
 */
export function AiReplyButton({
  reviewId,
  onStream,
  profileId,
  disabled,
  size = 'sm'
}: AiReplyButtonProps) {
  const t = useTranslations('ai-replies.button');
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    try {
      // The endpoint is dual (JSON or event-stream); the JSON branch is what the stub uses.
      const { variants } = (await generateAiReply({
        review_id: reviewId,
        profile_id: profileId ?? null,
        variants: 1
      })) as { variants: string[] };
      const words = (variants[0] ?? '').split(' ');
      let acc = '';
      for (let i = 0; i < words.length; i++) {
        acc += (i ? ' ' : '') + words[i];
        onStream(acc, false);
        await new Promise((r) => setTimeout(r, 25));
      }
      onStream(acc, true);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button variant='outline' size={size} onClick={run} disabled={disabled || pending}>
      {pending ? (
        <Icons.spinner className='size-4 animate-spin' />
      ) : (
        <Icons.sparkles className='size-4' />
      )}
      {t('generate')}
    </Button>
  );
}
