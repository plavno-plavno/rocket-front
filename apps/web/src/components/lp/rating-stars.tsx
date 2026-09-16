import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  /** 1..5 or null for "без оценки". */
  rating: number | null | undefined;
  size?: 'sm' | 'md';
  /** Show the numeric value next to the stars. */
  showValue?: boolean;
  className?: string;
}

/** Star rating (SDD-01 §4.1). Colour is paired with an accessible label. */
export function RatingStars({
  rating,
  size = 'sm',
  showValue = false,
  className
}: RatingStarsProps) {
  const t = useTranslations('common');
  const label = rating == null ? t('noRating') : t('ratingOf', { rating });
  const sizeClass = size === 'sm' ? 'size-3.5' : 'size-4.5';
  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Icons.star
          key={n}
          className={cn(
            sizeClass,
            rating != null && n <= rating
              ? 'fill-rating-star text-rating-star'
              : 'text-muted-foreground/40'
          )}
          aria-hidden
        />
      ))}
      {showValue && (
        <span className='text-muted-foreground ml-1 text-xs tabular-nums'>{rating ?? '—'}</span>
      )}
    </span>
  );
}
