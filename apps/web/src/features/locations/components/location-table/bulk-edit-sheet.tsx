'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
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
import { Textarea } from '@/components/ui/textarea';
import { isApiError } from '@/lib/api';
import { bulkUpdateLocationsMutation } from '../../api/mutations';
import type { LocationBulkRequest } from '../../api/types';

const KEEP = '__keep__';
const STATUSES = ['open', 'temporarily_closed', 'coming_soon', 'permanently_closed'] as const;

/**
 * Bulk edit (S-LOC-01): a patch of shared fields for the selected locations.
 * `patch` is typed as `LocationCore` in the contract; we send a partial (see CHANGE_REQUESTS).
 */
export function BulkEditSheet({
  open,
  onOpenChange,
  locationIds,
  scope,
  onStarted
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationIds: string[];
  scope: string;
  onStarted: (batchId: string) => void;
}) {
  const t = useTranslations('locations.bulk.edit');
  const tStatus = useTranslations('locations.status');
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>(KEEP);
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation(bulkUpdateLocationsMutation(queryClient, scope));

  const patch: Record<string, unknown> = {};
  if (status !== KEEP) patch.status = status;
  if (website.trim()) patch.website = website.trim();
  if (description.trim()) patch.description = description.trim();
  const dirty = Object.keys(patch).length > 0;

  const submit = async () => {
    setError(null);
    try {
      const batch = await mutation.mutateAsync({
        location_ids: locationIds,
        patch: patch as LocationBulkRequest['patch']
      });
      toast.success(t('queued'));
      onOpenChange(false);
      onStarted(batch.id);
    } catch (e) {
      setError(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col gap-4 sm:max-w-md' data-testid='bulk-edit-sheet'>
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('description', { count: locationIds.length })}</SheetDescription>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-4 px-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel>{t('status')}</FieldLabel>
            <Select value={status} onValueChange={(v) => setStatus(v ?? KEEP)}>
              <SelectTrigger aria-label={t('status')}>
                <SelectValue>
                  {(v: string) =>
                    v === KEEP ? t('keep') : tStatus(v as (typeof STATUSES)[number])
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={KEEP}>{t('keep')}</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {tStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor='bulk-website'>{t('website')}</FieldLabel>
            <Input
              id='bulk-website'
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t('keep')}
              inputMode='url'
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='bulk-description'>{t('description_field')}</FieldLabel>
            <Textarea
              id='bulk-description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('keep')}
              rows={5}
              maxLength={4000}
            />
            <FieldDescription>{t('hoursHint')}</FieldDescription>
          </Field>
        </div>
        <SheetFooter>
          <Button onClick={submit} disabled={!dirty || mutation.isPending}>
            {mutation.isPending && <Icons.spinner className='size-4 animate-spin' />}
            {t('submit')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
