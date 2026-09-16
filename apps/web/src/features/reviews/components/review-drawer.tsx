'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { PlatformIcon, RatingStars } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/link-button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { reviewQueryOptions, reviewRepliesQueryOptions } from '../api/queries';

export interface ReviewDrawerProps {
  reviewId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Public stub (SDD-01T §3.5): Sheet with the review text, rating, replies and a link to the inbox. UI-F2 replaces the body with the full detail. */
export function ReviewDrawer({ reviewId, open, onOpenChange }: ReviewDrawerProps) {
  const t = useTranslations('reviews.drawer');
  const ts = useTranslations('reviews.workflow');
  const format = useFormatter();
  const { data: review, isPending } = useQuery({
    ...reviewQueryOptions(reviewId ?? ''),
    enabled: open && !!reviewId
  });
  const { data: replies } = useQuery({
    ...reviewRepliesQueryOptions(reviewId ?? ''),
    enabled: open && !!reviewId
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-4 sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>
            {review
              ? `${review.location_name ?? ''} · ${format.dateTime(new Date(review.published_at), 'long')}`
              : ' '}
          </SheetDescription>
        </SheetHeader>
        {isPending || !review ? (
          <div className='flex flex-col gap-2 px-4'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-20' />
          </div>
        ) : (
          <div className='flex flex-col gap-4 overflow-y-auto px-4 pb-4'>
            <div className='flex items-center gap-2'>
              <PlatformIcon platformId={review.platform_id} className='size-5' />
              <span className='font-medium'>{review.author.name}</span>
              <RatingStars rating={review.rating} />
              <Badge variant='outline' className='ml-auto'>
                {ts(review.workflow_status)}
              </Badge>
            </div>
            <p className='text-sm leading-relaxed whitespace-pre-wrap'>
              {review.text ?? <span className='text-muted-foreground italic'>{t('noText')}</span>}
            </p>
            {replies?.items.length ? (
              <div className='flex flex-col gap-2'>
                <p className='text-muted-foreground text-xs font-medium'>
                  {t('replies', { count: replies.items.length })}
                </p>
                {replies.items.map((r) => (
                  <div key={r.id} className='bg-muted/50 rounded-md p-3 text-sm'>
                    <p className='text-muted-foreground mb-1 text-xs'>
                      {r.author_name} · {t(`replyState.${r.state}`)}
                    </p>
                    <p className='whitespace-pre-wrap'>{r.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <LinkButton variant='outline' href={`/dashboard/reviews?review=${review.id}`}>
              {t('openInInbox')}
            </LinkButton>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
