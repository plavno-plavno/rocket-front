'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface DistributionSegment {
  key: string;
  label: string;
  value: number;
  /** Tailwind background class, e.g. `bg-rating-positive`. */
  colorClass: string;
}

export interface DistributionCardProps {
  title: string;
  segments: DistributionSegment[];
  /** Currently selected segment key (acts as a filter). */
  active?: string | null;
  onSelect?: (key: string | null) => void;
  className?: string;
  formatValue?: (value: number, share: number) => string;
}

/** Segmented bar + legend; click on a segment toggles a filter (SDD-01 §4.1). */
export function DistributionCard({
  title,
  segments,
  active,
  onSelect,
  className,
  formatValue
}: DistributionCardProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const fmt = formatValue ?? ((v: number, share: number) => `${v} · ${Math.round(share * 100)}%`);
  return (
    <Card className={cn('gap-3 py-4', className)}>
      <CardHeader className='px-4'>
        <CardTitle className='text-sm'>{title}</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-3 px-4'>
        <div className='flex h-3 w-full overflow-hidden rounded-full' role='img' aria-label={title}>
          {segments.map((s) => (
            <button
              key={s.key}
              type='button'
              className={cn(
                'h-full transition-opacity',
                s.colorClass,
                active && active !== s.key && 'opacity-40',
                onSelect && 'cursor-pointer'
              )}
              style={{ width: `${(s.value / total) * 100}%` }}
              aria-label={`${s.label}: ${fmt(s.value, s.value / total)}`}
              aria-pressed={active === s.key}
              onClick={() => onSelect?.(active === s.key ? null : s.key)}
              disabled={!onSelect}
            />
          ))}
        </div>
        <ul className='grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3'>
          {segments.map((s) => (
            <li
              key={s.key}
              className={cn('flex items-center gap-2', active && active !== s.key && 'opacity-60')}
            >
              <span className={cn('size-2.5 shrink-0 rounded-sm', s.colorClass)} aria-hidden />
              <span className='truncate'>{s.label}</span>
              <span className='text-muted-foreground ml-auto tabular-nums'>
                {fmt(s.value, s.value / total)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
