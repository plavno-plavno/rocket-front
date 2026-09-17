'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { complaintReasonsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { createReviewComplaintMutation } from '../../api/mutations';

/** «Пожаловаться» (SCR-3): reason from the platform's list + optional comment. */
export function ComplaintDialog({
  open,
  onOpenChange,
  reviewId,
  platformId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
  platformId: string;
}) {
  const t = useTranslations('reviews.detail.complaint');
  const queryClient = useQueryClient();
  const { data } = useQuery({ ...complaintReasonsQueryOptions(platformId), enabled: open });
  const [reason, setReason] = useState<string | null>(null);
  const [text, setText] = useState('');
  const mutation = useMutation(createReviewComplaintMutation(queryClient));

  const submit = async () => {
    if (!reason) return;
    try {
      await mutation.mutateAsync({
        id: reviewId,
        body: { reason_code: reason, text: text.trim() || undefined }
      });
      toast.success(t('sent'));
      onOpenChange(false);
      setReason(null);
      setText('');
    } catch (e) {
      toast.error(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid='complaint-dialog'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel>{t('reason')}</FieldLabel>
          <RadioGroup value={reason} onValueChange={(v) => setReason(v as string)}>
            {(data?.items ?? []).map((r) => (
              <div key={r.code} className='flex items-center gap-2'>
                <RadioGroupItem value={r.code} id={`reason-${r.code}`} />
                <Label htmlFor={`reason-${r.code}`} className='font-normal'>
                  {r.title}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor='complaint-text'>{t('text')}</FieldLabel>
          <Textarea
            id='complaint-text'
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
          />
        </Field>
        <DialogFooter>
          <Button onClick={submit} disabled={!reason || mutation.isPending}>
            {mutation.isPending && <Icons.spinner className='size-4 animate-spin' />}
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
