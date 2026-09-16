'use client';

import { Icons } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface StatusStatCardProps {
  title: string;
  value: number | string | null | undefined;
  /** "из N" — renders a progress bar when both `value` and `total` are numbers. */
  total?: number;
  ofLabel?: string;
  icon?: keyof typeof Icons;
  /** Tailwind colour classes for the icon (e.g. `text-status-synced`). */
  tone?: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
  /** Delta vs previous period, e.g. "+12 %". */
  delta?: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
}

/**
 * KPI card (SDD-01 §4.1 — SCR-1, SCR-3, SCR-4): icon, number, optional "of N" + progress,
 * clickable to act as a filter (`active` highlights the current filter).
 */
export function StatusStatCard({
  title,
  value,
  total,
  ofLabel,
  icon,
  tone,
  hint,
  active,
  onClick,
  loading,
  className,
  delta,
  deltaTone = 'neutral'
}: StatusStatCardProps) {
  const Icon = icon ? Icons[icon] : null;
  const numeric = typeof value === 'number';
  const percent =
    numeric && typeof total === 'number' && total > 0 ? Math.round((value / total) * 100) : null;
  const interactive = !!onClick;
  const Comp = interactive ? 'button' : 'div';

  return (
    <Card
      className={cn(
        'gap-0 py-0',
        interactive &&
          'hover:border-primary/40 focus-within:ring-ring/50 cursor-pointer transition-colors focus-within:ring-2',
        active && 'border-primary ring-primary/20 ring-2',
        className
      )}
      data-active={active || undefined}
    >
      <Comp
        type={interactive ? 'button' : undefined}
        onClick={onClick}
        aria-pressed={interactive ? !!active : undefined}
        className='w-full text-left outline-none'
      >
        <CardContent className='flex flex-col gap-2 p-4'>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            {Icon && <Icon className={cn('size-4', tone)} />}
            <span className='truncate'>{title}</span>
          </div>
          {loading ? (
            <Skeleton className='h-8 w-24' />
          ) : (
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-semibold tabular-nums'>{value ?? '—'}</span>
              {typeof total === 'number' && ofLabel && (
                <span className='text-muted-foreground text-xs'>{ofLabel}</span>
              )}
              {delta && (
                <span
                  className={cn(
                    'ml-auto text-xs font-medium',
                    deltaTone === 'positive' && 'text-rating-positive',
                    deltaTone === 'negative' && 'text-rating-negative',
                    deltaTone === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  {delta}
                </span>
              )}
            </div>
          )}
          {percent !== null && (
            <Progress value={percent} className='h-1.5' aria-label={`${percent}%`} />
          )}
          {hint && <p className='text-muted-foreground text-xs'>{hint}</p>}
        </CardContent>
      </Comp>
    </Card>
  );
}
