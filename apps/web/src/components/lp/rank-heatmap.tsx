'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface RankCell {
  lat: number;
  lng: number;
  /** 1..N, null = outside top-N. */
  rank: number | null;
}

export interface RankHeatmapProps {
  cells: RankCell[];
  /** Grid size (3, 5, 7, 9) — cells are laid out row-major. */
  size: number;
  center?: { lat: number; lng: number };
  onCellClick?: (cell: RankCell) => void;
  className?: string;
}

function tone(rank: number | null): string {
  if (rank == null) return 'bg-status-neutral-bg text-status-neutral';
  if (rank <= 3) return 'bg-status-synced text-white';
  if (rank <= 10) return 'bg-status-action text-white';
  return 'bg-status-error text-white';
}

/**
 * Foundation stub of the rank heatmap (S-RNK-01): a square grid of rank badges with the props the
 * MapLibre version keeps (provider/licence decided in SDD-06; UI-DS swaps the body).
 */
export function RankHeatmap({ cells, size, onCellClick, className }: RankHeatmapProps) {
  const t = useTranslations('common');
  return (
    <div
      className={cn('grid aspect-square w-full max-w-md gap-1', className)}
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      role='grid'
      aria-label={t('rankGrid')}
      data-stub='rank-heatmap'
    >
      {cells.map((c, i) => (
        <button
          key={i}
          type='button'
          role='gridcell'
          onClick={() => onCellClick?.(c)}
          title={`${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`}
          className={cn(
            'flex items-center justify-center rounded-md text-xs font-semibold tabular-nums',
            tone(c.rank)
          )}
        >
          {c.rank ?? '20+'}
        </button>
      ))}
    </div>
  );
}
