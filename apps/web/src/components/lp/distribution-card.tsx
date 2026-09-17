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
            <span
              key={s.key}
              className={cn('h-full', s.colorClass, active && active !== s.key && 'opacity-40')}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ))}
        </div>
        <ul className='grid gap-2 text-sm sm:grid-cols-2'>
          {segments.map((s) => {
            const Comp = onSelect ? 'button' : 'div';
            return (
              <li key={s.key} className={cn('min-w-0', active && active !== s.key && 'opacity-60')}>
                <Comp
                  type={onSelect ? 'button' : undefined}
                  onClick={onSelect ? () => onSelect(active === s.key ? null : s.key) : undefined}
                  aria-pressed={onSelect ? active === s.key : undefined}
                  className={cn(
                    'flex w-full flex-wrap items-center gap-2 rounded-lg px-2 py-2 text-left',
                    onSelect && 'hover:bg-muted focus-visible:ring-ring focus-visible:ring-2'
                  )}
                >
                  <span className={cn('size-2.5 shrink-0 rounded-sm', s.colorClass)} aria-hidden />
                  <span>{s.label}</span>
                  <span className='text-muted-foreground ml-auto tabular-nums'>
                    {fmt(s.value, s.value / total)}
                  </span>
                </Comp>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
