'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Textarea } from '@/components/ui/textarea';
import { AiReplyButton } from '@/features/ai-replies';
import { TemplatePicker, type TemplatePickerReviewContext } from '@/features/templates';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { createReviewReplyMutation, updateReviewReplyMutation } from '../../api/mutations';
import type { Review, ReviewReply } from '../../api/types';

const MAX = 4000;

export interface ReplyComposerHandle {
  focus: () => void;
}

export interface ReplyComposerProps {
  review: Review;
  reviewContext: TemplatePickerReviewContext;
  /** Platform capability: replies supported. */
  canReply: boolean;
  /** When set, the composer edits an existing reply instead of creating one. */
  editing?: ReviewReply | null;
  onCancelEdit?: () => void;
  onDone?: () => void;
  compact?: boolean;
}

/** Renders `{{var}}` placeholders with the review context (preview only; the server does the real substitution). */
function renderPreview(text: string, ctx: TemplatePickerReviewContext) {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (m, key: string) => {
    const v = ctx[key as keyof TemplatePickerReviewContext];
    return v === undefined || v === null ? m : String(v);
  });
}

/** Composer (SCR-3): textarea, template, AI stream, preview, publish / draft, edit mode. */
export const ReplyComposer = forwardRef<ReplyComposerHandle, ReplyComposerProps>(
  function ReplyComposer(
    { review, reviewContext, canReply, editing, onCancelEdit, onDone, compact },
    ref
  ) {
    const t = useTranslations('reviews.composer');
    const queryClient = useQueryClient();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [text, setText] = useState(editing?.text ?? '');
    const [templateId, setTemplateId] = useState<string | null>(null);
    const [origin, setOrigin] = useState<ReviewReply['origin']>('manual');
    const [preview, setPreview] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const create = useMutation(createReviewReplyMutation(queryClient));
    const update = useMutation(updateReviewReplyMutation(queryClient));

    useImperativeHandle(ref, () => ({ focus: () => textareaRef.current?.focus() }), []);

    const pending = create.isPending || update.isPending;
    const hasVars = /\{\{\s*[a-z_]+\s*\}\}/.test(text);

    const submit = async (publish: boolean) => {
      setError(null);
      try {
        if (editing) {
          await update.mutateAsync({
            id: review.id,
            replyId: editing.id,
            body: { text, publish: true }
          });
          toast.success(t('saveEdit'));
          onCancelEdit?.();
        } else {
          await create.mutateAsync({
            id: review.id,
            body: { text, publish, template_id: templateId, origin }
          });
          toast.success(publish ? t('published') : t('draftSaved'));
          setText('');
          setTemplateId(null);
          setOrigin('manual');
          setPreview(false);
        }
        onDone?.();
      } catch (e) {
        setError(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);
      }
    };

    return (
      <div className='flex flex-col gap-2' data-testid='reply-composer'>
        {!canReply && !editing && (
          <Alert>
            <AlertDescription>{t('noReplySupport')}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {preview ? (
          <div className='bg-muted/50 min-h-24 rounded-md border p-3 text-sm whitespace-pre-wrap'>
            {renderPreview(text, reviewContext)}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder={t('placeholder')}
            rows={compact ? 3 : 5}
            maxLength={MAX}
            disabled={streaming || (!canReply && !editing)}
            aria-label={t('placeholder')}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && text.trim()) void submit(true);
            }}
          />
        )}
        <div className='flex flex-wrap items-center gap-2'>
          {!editing && (
            <>
              <TemplatePicker
                reviewContext={reviewContext}
                disabled={streaming || !canReply}
                onInsert={(rendered, template) => {
                  setText(rendered.slice(0, MAX));
                  setTemplateId(template.id);
                  setOrigin('template');
                  textareaRef.current?.focus();
                }}
              />
              <AiReplyButton
                reviewId={review.id}
                size='sm'
                disabled={!canReply}
                onStream={(partial, done) => {
                  setStreaming(!done);
                  setText(partial.slice(0, MAX));
                  setOrigin('ai');
                  setTemplateId(null);
                }}
              />
            </>
          )}
          {hasVars && (
            <Button
              variant={preview ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => setPreview((v) => !v)}
              aria-pressed={preview}
            >
              <Icons.eye className='size-4' /> {t('preview')}
            </Button>
          )}
          <span
            className={cn(
              'text-muted-foreground ml-auto text-xs tabular-nums',
              text.length >= MAX && 'text-status-error'
            )}
          >
            {t('charCount', { count: text.length, max: MAX })}
          </span>
        </div>
        {hasVars && <p className='text-muted-foreground text-xs'>{t('variables')}</p>}
        <div className='flex flex-wrap items-center justify-end gap-2'>
          {editing ? (
            <>
              <Button variant='outline' size='sm' onClick={onCancelEdit} disabled={pending}>
                {t('cancelEdit')}
              </Button>
              <Button size='sm' onClick={() => submit(true)} disabled={!text.trim() || pending}>
                {pending && <Icons.spinner className='size-4 animate-spin' />}
                {t('saveEdit')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() => submit(false)}
                disabled={!text.trim() || pending || streaming}
              >
                {t('draft')}
              </Button>
              <Button
                size='sm'
                onClick={() => submit(true)}
                disabled={!text.trim() || pending || streaming || !canReply}
                data-testid='publish-reply'
              >
                {pending ? (
                  <Icons.spinner className='size-4 animate-spin' />
                ) : (
                  <Icons.send className='size-4' />
                )}
                {t('publish')}
                {!compact && (
                  <Kbd className='ml-1 hidden bg-transparent text-[10px] opacity-70 sm:inline'>
                    ⌘↵
                  </Kbd>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
);
