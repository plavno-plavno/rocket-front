'use client';

import { useCompletion } from '@ai-sdk/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

/** S-REV-05 sandbox [H-UI-10]: sample review → streamed reply through `/api/ai/reply`. */
export function AiSandbox({ profileId }: { profileId: string | null }) {
  const t = useTranslations('ai-replies.sandbox');
  const [text, setText] = useState(t('sample'));
  const [rating, setRating] = useState('4');
  const [location, setLocation] = useState('');
  const { completion, complete, isLoading, stop, error } = useCompletion({
    api: '/api/ai/reply',
    body: {
      profile_id: profileId && profileId !== '__new__' ? profileId : null,
      sample_review: {
        text,
        rating: rating === 'none' ? null : Number(rating),
        location_name: location || undefined
      }
    },
    onError: (e) => toast.error(e.message)
  });

  return (
    <Card data-testid='ai-sandbox'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <Field>
          <FieldLabel htmlFor='sb-text'>{t('text')}</FieldLabel>
          <Textarea id='sb-text' rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel>{t('rating')}</FieldLabel>
            <ToggleGroup
              value={[rating]}
              onValueChange={(v) => {
                const n = Array.isArray(v) ? v[0] : v;
                if (n) setRating(n as string);
              }}
            >
              {['1', '2', '3', '4', '5', 'none'].map((r) => (
                <ToggleGroupItem key={r} value={r} size='sm' aria-label={r}>
                  {r === 'none' ? '—' : `${r} ★`}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor='sb-location'>{t('location')}</FieldLabel>
            <Input
              id='sb-location'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('locationPlaceholder')}
            />
          </Field>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            onClick={() => (isLoading ? stop() : void complete(''))}
            disabled={!text.trim()}
            data-testid='sandbox-generate'
          >
            {isLoading ? (
              <Icons.spinner className='size-4 animate-spin' />
            ) : (
              <Icons.sparkles className='size-4' />
            )}
            {isLoading ? t('stop') : t('generate')}
          </Button>
          {completion && !isLoading && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                void navigator.clipboard.writeText(completion);
                toast.success(t('copied'));
              }}
            >
              <Icons.copy className='size-4' /> {t('copy')}
            </Button>
          )}
        </div>
        <div
          className={cn(
            'bg-muted/50 min-h-32 rounded-md border p-3 text-sm whitespace-pre-wrap',
            !completion && 'text-muted-foreground italic'
          )}
          aria-live='polite'
          data-testid='sandbox-result'
        >
          {completion || (error ? error.message : t('empty'))}
          {isLoading && (
            <span
              className='bg-foreground ml-0.5 inline-block h-4 w-0.5 animate-pulse align-middle'
              aria-hidden
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
