'use client';

import { diffWords } from 'diff';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

export interface ReviewVersionDiffProps {
  /** Previous text (or null when the previous version had no text). */
  before: string | null;
  after: string | null;
  beforeRating?: number | null;
  afterRating?: number | null;
  /** Trigger content; defaults to the «Изменён» badge. */
  children?: React.ReactNode;
  className?: string;
}

/** Word-level diff between two review versions in a hover-card (SDD-01 §4.1, SCR-4 «изменено»). */
export function ReviewVersionDiff({
  before,
  after,
  beforeRating,
  afterRating,
  children,
  className
}: ReviewVersionDiffProps) {
  const t = useTranslations('reviewDiff');
  const parts = diffWords(before ?? '', after ?? '');
  return (
    <HoverCard>
      <HoverCardTrigger delay={150} render={<span className={cn('inline-flex', className)} />}>
        {children ?? (
          <Badge variant='outline' className='text-status-action border-status-action/40 gap-1'>
            {t('edited')}
          </Badge>
        )}
      </HoverCardTrigger>
      <HoverCardContent className='w-96 p-3 text-sm' align='start'>
        {(beforeRating !== undefined || afterRating !== undefined) &&
          beforeRating !== afterRating && (
            <p className='text-muted-foreground mb-2 text-xs'>
              {t('rating')}: {beforeRating ?? '—'} → {afterRating ?? '—'}
            </p>
          )}
        <p className='leading-relaxed'>
          {parts.map((part, i) => (
            <span
              key={i}
              className={cn(
                part.added && 'bg-status-synced-bg text-status-synced rounded px-0.5',
                part.removed && 'bg-status-error-bg text-status-error rounded px-0.5 line-through'
              )}
            >
              {part.value}
            </span>
          ))}
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
