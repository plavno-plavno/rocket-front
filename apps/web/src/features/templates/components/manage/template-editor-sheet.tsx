'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { RatingStars, TemplateBodyEditor } from '@/components/lp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { reviewsQueryOptions } from '@/features/reviews';
import { useCan } from '@/features/session';
import { isApiError } from '@/lib/api';
import {
  createReplyTemplateMutation,
  renderReplyTemplateMutation,
  updateReplyTemplateMutation
} from '../../api/mutations';
import { templateGroupsQueryOptions } from '../../api/queries';
import type { ReplyTemplate } from '../../api/types';

const NONE = '__none__';
const SENTIMENTS = ['any', 'positive', 'neutral', 'negative'] as const;

/** Sheet editor (SCR-5): name, group, type, sentiment hint, body with `{{variables}}`, preview on a real review. */
export function TemplateEditorSheet({
  open,
  onOpenChange,
  template,
  onSaved
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = create. */
  template: ReplyTemplate | null;
  onSaved?: (template: ReplyTemplate) => void;
}) {
  const t = useTranslations('templates.editor');
  const tv = useTranslations('templates.visibility');
  const ts = useTranslations('templates.sentiment');
  const tg = useTranslations('templates.table');
  const queryClient = useQueryClient();
  const canTeam = useCan('templates.team');
  const { data: groups } = useQuery({ ...templateGroupsQueryOptions(), enabled: open });
  const { data: reviews } = useQuery({
    ...reviewsQueryOptions({ limit: 20, scope: 'all', 'filter[has_text]': true }),
    enabled: open
  });

  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<string>(NONE);
  const [visibility, setVisibility] = useState<ReplyTemplate['visibility']>('team');
  const [sentiment, setSentiment] = useState<(typeof SENTIMENTS)[number]>('any');
  const [body, setBody] = useState('');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; body?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? '');
    setGroupId(template?.group_id ?? NONE);
    setVisibility(template?.visibility ?? (canTeam ? 'team' : 'private'));
    setSentiment(template?.sentiment_hint ?? 'any');
    setBody(template?.body ?? '');
    setErrors({});
    setApiError(null);
  }, [open, template, canTeam]);

  const create = useMutation(createReplyTemplateMutation(queryClient));
  const update = useMutation(updateReplyTemplateMutation(queryClient));
  const render = useMutation(renderReplyTemplateMutation(queryClient));
  const pending = create.isPending || update.isPending;

  const review = reviews?.items.find((r) => r.id === reviewId) ?? reviews?.items[0];
  useEffect(() => {
    if (!open || !body.trim()) return;
    const handle = setTimeout(
      () => render.mutate({ body: { body, review_id: review?.id ?? null } }),
      400
    );
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, body, review?.id]);

  const submit = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = t('nameRequired');
    if (!body.trim()) next.body = t('bodyRequired');
    setErrors(next);
    if (Object.keys(next).length) return;
    setApiError(null);
    const payload = {
      name: name.trim(),
      body,
      group_id: groupId === NONE ? null : groupId,
      visibility,
      sentiment_hint: sentiment === 'any' ? undefined : sentiment
    };
    try {
      const saved = template
        ? await update.mutateAsync({ id: template.id, body: payload })
        : await create.mutateAsync({ body: payload });
      toast.success(template ? t('updated') : t('created'));
      onOpenChange(false);
      onSaved?.(saved);
    } catch (e) {
      setApiError(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);
    }
  };

  const previewCtx = review
    ? {
        author_name: review.author.name,
        location_name: review.location_name ?? '',
        rating: review.rating == null ? '' : String(review.rating)
      }
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='flex w-full flex-col gap-0 p-0 sm:max-w-2xl'
        data-testid='template-editor'
      >
        <SheetHeader className='border-b'>
          <SheetTitle>{template ? t('editTitle') : t('createTitle')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>
        <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4'>
          {apiError && (
            <Alert variant='destructive'>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor='tpl-name'>{t('name')}</FieldLabel>
            <Input
              id='tpl-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              aria-invalid={!!errors.name}
            />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </Field>
          <div className='grid gap-4 sm:grid-cols-3'>
            <Field>
              <FieldLabel>{t('group')}</FieldLabel>
              <Select value={groupId} onValueChange={(v) => setGroupId(v ?? NONE)}>
                <SelectTrigger aria-label={t('group')}>
                  <SelectValue>
                    {(v: string) =>
                      v === NONE
                        ? tg('ungrouped')
                        : (groups?.items.find((g) => g.id === v)?.name ?? '')
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{tg('ungrouped')}</SelectItem>
                  {(groups?.items ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>{t('visibility')}</FieldLabel>
              <Select
                value={visibility}
                onValueChange={(v) => v && setVisibility(v as ReplyTemplate['visibility'])}
              >
                <SelectTrigger aria-label={t('visibility')}>
                  <SelectValue>{(v: ReplyTemplate['visibility']) => tv(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='private'>{tv('private')}</SelectItem>
                  {canTeam && <SelectItem value='team'>{tv('team')}</SelectItem>}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>{t('sentiment')}</FieldLabel>
              <Select
                value={sentiment}
                onValueChange={(v) => v && setSentiment(v as (typeof SENTIMENTS)[number])}
              >
                <SelectTrigger aria-label={t('sentiment')}>
                  <SelectValue>{(v: (typeof SENTIMENTS)[number]) => ts(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SENTIMENTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ts(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor='tpl-body'>{t('body')}</FieldLabel>
            <TemplateBodyEditor
              id='tpl-body'
              value={body}
              onChange={setBody}
              previewContext={previewCtx}
              maxLength={2000}
            />
            {errors.body && <FieldError>{errors.body}</FieldError>}
            {render.data?.unknown_variables?.length ? (
              <FieldDescription className='text-status-action'>
                {t('unknownVariables', { list: render.data.unknown_variables.join(', ') })}
              </FieldDescription>
            ) : null}
          </Field>
          <Field>
            <FieldLabel>{t('preview')}</FieldLabel>
            <FieldDescription>{t('previewHint')}</FieldDescription>
            <Select value={review?.id ?? null} onValueChange={setReviewId}>
              <SelectTrigger aria-label={t('preview')}>
                <SelectValue placeholder={t('previewEmpty')}>
                  {(id: string | null) => {
                    const r = reviews?.items.find((x) => x.id === id);
                    return r ? `${r.author.name} · ${r.location_name ?? ''}` : t('previewEmpty');
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(reviews?.items ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className='flex items-center gap-2'>
                      <RatingStars rating={r.rating} />
                      <span className='truncate'>
                        {r.author.name} · {r.location_name}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {review && (
              <div className='bg-muted/50 mt-2 rounded-md border p-3 text-sm'>
                <p className='text-muted-foreground mb-2 line-clamp-2 text-xs italic'>
                  «{review.text}»
                </p>
                <p className='whitespace-pre-wrap' data-testid='template-preview'>
                  {render.data?.text ?? '…'}
                </p>
              </div>
            )}
          </Field>
        </div>
        <SheetFooter>
          <Button onClick={submit} disabled={pending} data-testid='template-save'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {t('save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
