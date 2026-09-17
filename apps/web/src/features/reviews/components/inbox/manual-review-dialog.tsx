'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { RatingStars } from '@/components/lp';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LocationPicker } from '@/features/locations';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { createManualReviewMutation } from '../../api/mutations';

/** «Добавить отзыв» [H-UI-06]: for platforms without an API or reviews received in person. */
export function ManualReviewDialog({
  open,
  onOpenChange,
  onCreated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const t = useTranslations('reviews.manual');
  const queryClient = useQueryClient();
  const { data: platforms } = useQuery({ ...platformsQueryOptions(), enabled: open });
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [rating, setRating] = useState<string>('5');
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const mutation = useMutation(createManualReviewMutation(queryClient));
  const valid = locationIds.length === 1 && !!platformId && !!date;

  const submit = async () => {
    if (!valid) return;
    try {
      const created = await mutation.mutateAsync({
        body: {
          location_id: locationIds[0]!,
          platform_id: platformId!,
          author_name: author.trim() || undefined,
          rating: rating === 'none' ? null : Number(rating),
          text: text.trim() || null,
          published_at: new Date(`${date}T12:00:00`).toISOString()
        }
      });
      toast.success(t('added'));
      onOpenChange(false);
      setText('');
      setAuthor('');
      onCreated?.(created.id);
    } catch (e) {
      toast.error(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg' data-testid='manual-review-dialog'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-3 sm:grid-cols-2'>
          <Field className='sm:col-span-2'>
            <FieldLabel>{t('location')}</FieldLabel>
            <LocationPicker
              mode='single'
              allowGroups={false}
              value={{ location_ids: locationIds, group_ids: [] }}
              onChange={(v) => setLocationIds(v.location_ids)}
            />
          </Field>
          <Field>
            <FieldLabel>{t('platform')}</FieldLabel>
            <Select value={platformId} onValueChange={setPlatformId}>
              <SelectTrigger aria-label={t('platform')}>
                <SelectValue placeholder={t('platform')}>
                  {(v: string | null) =>
                    platforms?.items.find((p) => p.id === v)?.name ?? t('platform')
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(platforms?.items ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor='manual-date'>{t('date')}</FieldLabel>
            <Input
              id='manual-date'
              type='date'
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field className='sm:col-span-2'>
            <FieldLabel>{t('rating')}</FieldLabel>
            <ToggleGroup
              value={[rating]}
              onValueChange={(v) => {
                const next = Array.isArray(v) ? v[0] : v;
                if (next) setRating(next as string);
              }}
            >
              {['1', '2', '3', '4', '5', 'none'].map((r) => (
                <ToggleGroupItem key={r} value={r} size='sm' aria-label={r}>
                  {r === 'none' ? <RatingStars rating={null} /> : `${r} ★`}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field className='sm:col-span-2'>
            <FieldLabel htmlFor='manual-author'>{t('author')}</FieldLabel>
            <Input id='manual-author' value={author} onChange={(e) => setAuthor(e.target.value)} />
          </Field>
          <Field className='sm:col-span-2'>
            <FieldLabel htmlFor='manual-text'>{t('text')}</FieldLabel>
            <Textarea
              id='manual-text'
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!valid || mutation.isPending}>
            {mutation.isPending && <Icons.spinner className='size-4 animate-spin' />}
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
