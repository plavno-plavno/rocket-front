'use client';

import { Icons } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePanelMotion } from '@/hooks/use-panel-motion';

export interface StatusStatCardProps {
  title: string;
  value: number | string | null | undefined;
  /** "из N" — renders a progress bar when both `value` and `total` are numbers. */
  total?: number;
  ofLabel?: string;
  icon?: keyof typeof Icons;
  /** Tailwind colour classes for the icon (e.g. `text-status-synced`). */
  tone?: string;
  /** Tile surface. Derived from `tone` by default; set it where neighbours would repeat a hue. */
  surface?: StatSurface;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
  /** Delta vs previous period, e.g. "+12 %". */
  delta?: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
}

export type StatSurface = 'mint' | 'blue' | 'peach' | 'rose' | 'slate' | 'violet';

/**
 * Surface of a KPI tile, derived from the semantic colour of its icon: one hue per meaning, so
 * tiles standing side by side read as different (they all used to fall back to blue).
 */
function surfaceTone(tone?: string): StatSurface {
  if (!tone) return 'blue';
  if (/synced|positive/.test(tone)) return 'mint';
  if (/sent/.test(tone)) return 'blue';
  if (/action/.test(tone)) return 'peach';
  if (/error|negative/.test(tone)) return 'rose';
  if (/none|neutral/.test(tone)) return 'slate';
  if (/star/.test(tone)) return 'violet';
  return 'blue';
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
  surface,
  hint,
  active,
  onClick,
  loading,
  className,
  delta,
  deltaTone = 'neutral'
}: StatusStatCardProps) {
  const motionRef = usePanelMotion(!loading, true);
  const Icon = icon ? Icons[icon] : null;
  const numeric = typeof value === 'number';
  const percent =
    numeric && typeof total === 'number' && total > 0 ? Math.round((value / total) * 100) : null;
  const interactive = !!onClick;
  const Comp = interactive ? 'button' : 'div';

  return (
    <Card
      ref={motionRef}
      className={cn(
        'lp-stat-card gap-0 py-0',
        interactive &&
          'hover:border-primary/40 focus-within:ring-ring/50 cursor-pointer transition-colors focus-within:ring-2',
        active && 'border-primary ring-primary/20 ring-2',
        className
      )}
      data-active={active || undefined}
      data-tone={surface ?? surfaceTone(tone)}
    >
      <Comp
        type={interactive ? 'button' : undefined}
        onClick={onClick}
        aria-pressed={interactive ? !!active : undefined}
        className='w-full text-left outline-none'
      >
        <CardContent className='relative flex h-full flex-col gap-3 p-5'>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            {Icon && (
              <span
                className={cn(
                  'lp-stat-icon flex size-10 shrink-0 items-center justify-center rounded-2xl',
                  tone
                )}
              >
                <Icon className='size-5' />
              </span>
            )}
            <span className='min-w-0 font-medium'>{title}</span>
          </div>
          {loading ? (
            <Skeleton className='h-8 w-24' />
          ) : (
            <div className='flex items-baseline gap-2'>
              <span className='text-3xl font-semibold tracking-tight tabular-nums'>
                {value ?? '—'}
              </span>
              {typeof total === 'number' && ofLabel && (
                <span className='text-muted-foreground text-xs'>{ofLabel}</span>
              )}
              {delta && (
                <span
                  className={cn(
                    'ml-auto rounded-full bg-card/70 px-2 py-1 text-xs font-medium',
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
