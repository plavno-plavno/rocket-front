'use client';

import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { ReviewDetail } from './review-detail';

export interface ReviewDrawerProps {
  reviewId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Public API (SDD-01T §3.5): the full review detail in a Sheet — used by F1 (location card), F4, F5. */
export function ReviewDrawer({ reviewId, open, onOpenChange }: ReviewDrawerProps) {
  const t = useTranslations('reviews.drawer');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-xl'>
        <SheetHeader className='border-b'>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription className='sr-only'>{t('title')}</SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 overflow-y-auto p-4'>
          {open && reviewId && <ReviewDetail reviewId={reviewId} compact showInboxLink />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
