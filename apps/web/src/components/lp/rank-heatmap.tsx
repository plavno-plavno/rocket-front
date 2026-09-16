'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  /** MapLibre style URL; defaults to NEXT_PUBLIC_MAP_STYLE_URL. Without it the grid view renders. */
  styleUrl?: string;
  height?: number;
}

const COLORS = {
  top: 'var(--status-synced)',
  mid: 'var(--status-action)',
  low: 'var(--status-error)',
  none: 'var(--status-neutral)'
} as const;

function tone(rank: number | null): keyof typeof COLORS {
  if (rank == null) return 'none';
  if (rank <= 3) return 'top';
  if (rank <= 10) return 'mid';
  return 'low';
}

const TONE_CLASS: Record<keyof typeof COLORS, string> = {
  top: 'bg-status-synced text-white',
  mid: 'bg-status-action text-white',
  low: 'bg-status-error text-white',
  none: 'bg-status-neutral-bg text-status-neutral'
};

/**
 * Local rank heatmap (S-RNK-01). With a map style it renders the grid points on MapLibre GL
 * (vector tiles provider/licence per SDD-06); otherwise a plain grid of rank badges.
 */
export function RankHeatmap({
  cells,
  size,
  center,
  onCellClick,
  className,
  styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL,
  height = 420
}: RankHeatmapProps) {
  const t = useTranslations('common');
  if (!styleUrl) {
    return (
      <div
        className={cn('grid aspect-square w-full max-w-md gap-1', className)}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        role='grid'
        aria-label={t('rankGrid')}
        data-heatmap='grid'
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
              TONE_CLASS[tone(c.rank)]
            )}
          >
            {c.rank ?? '20+'}
          </button>
        ))}
      </div>
    );
  }
  return (
    <MapHeatmap
      cells={cells}
      center={center}
      onCellClick={onCellClick}
      className={className}
      styleUrl={styleUrl}
      height={height}
      label={t('rankGrid')}
    />
  );
}

function MapHeatmap({
  cells,
  center,
  onCellClick,
  className,
  styleUrl,
  height,
  label
}: Required<Pick<RankHeatmapProps, 'cells' | 'styleUrl' | 'height'>> &
  Pick<RankHeatmapProps, 'center' | 'onCellClick' | 'className'> & { label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const clickRef = useRef(onCellClick);
  clickRef.current = onCellClick;
  // Re-create the map only when the data actually changes, not on every parent render.
  const signature = useMemo(
    () => JSON.stringify({ cells, center, styleUrl }),
    [cells, center, styleUrl]
  );
  const cellsRef = useRef(cells);
  cellsRef.current = cells;

  useEffect(() => {
    if (!el.current) return;
    let disposed = false;
    let map: import('maplibre-gl').Map | undefined;
    (async () => {
      const maplibregl = await import('maplibre-gl');
      // Worker is served from /public/vendor (copied by `pnpm gen`); the bundler cannot resolve MapLibre's sibling worker file.
      maplibregl.config.WORKER_URL = '/vendor/maplibre-gl-worker.mjs';
      await import('maplibre-gl/dist/maplibre-gl.css');
      if (disposed || !el.current) return;
      const c = center ?? { lat: cells[0]?.lat ?? 55.75, lng: cells[0]?.lng ?? 37.61 };
      const m = new maplibregl.Map({
        container: el.current,
        style: styleUrl,
        center: [c.lng, c.lat],
        zoom: 11,
        attributionControl: { compact: true }
      });
      map = m;
      if (process.env.NODE_ENV !== 'production')
        (el.current as HTMLDivElement & { lpMap?: unknown }).lpMap = m;
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      m.on('error', (e) => setError(e.error?.message ?? 'map error'));
      // style.load fires once the style JSON is parsed — sources of the base map may still be loading.
      m.on('style.load', () => {
        const map = m;
        // MapLibre cannot parse oklch()/lab() tokens — use sRGB equivalents of the status colours.
        const HEX: Record<keyof typeof COLORS, string> = {
          top: '#1f9d55',
          mid: '#d99a1f',
          low: '#d64545',
          none: '#8a8f99'
        };
        const color = (k: keyof typeof COLORS) => HEX[k];
        map.addSource('ranks', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: cells.map((cell, i) => ({
              type: 'Feature',
              id: i,
              geometry: { type: 'Point', coordinates: [cell.lng, cell.lat] },
              properties: {
                rank: cell.rank ?? 0,
                label: cell.rank == null ? '20+' : String(cell.rank),
                tone: tone(cell.rank)
              }
            }))
          }
        });
        map.addLayer({
          id: 'rank-circles',
          type: 'circle',
          source: 'ranks',
          paint: {
            'circle-radius': 16,
            'circle-opacity': 0.9,
            'circle-color': [
              'match',
              ['get', 'tone'],
              'top',
              color('top'),
              'mid',
              color('mid'),
              'low',
              color('low'),
              color('none')
            ],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1.5
          }
        });
        map.addLayer({
          id: 'rank-labels',
          type: 'symbol',
          source: 'ranks',
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
          },
          paint: { 'text-color': '#fff' }
        });
        map.on('click', 'rank-circles', (e) => {
          const f = e.features?.[0];
          if (f?.id != null) clickRef.current?.(cells[Number(f.id)]);
        });
        map.on(
          'mouseenter',
          'rank-circles',
          () => map && (map.getCanvas().style.cursor = 'pointer')
        );
        map.on('mouseleave', 'rank-circles', () => map && (map.getCanvas().style.cursor = ''));
        if (cells.length > 1) {
          const bounds = new maplibregl.LngLatBounds();
          for (const cell of cells) bounds.extend([cell.lng, cell.lat]);
          map.fitBounds(bounds, { padding: 40, duration: 0 });
        }
      });
    })();
    return () => {
      disposed = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature covers cells/center/styleUrl
  }, [signature]);

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-lg border', className)}
      style={{ height }}
      data-heatmap='map'
      aria-label={label}
      role='img'
    >
      <div ref={el} className='h-full w-full' />
      {error && (
        <p className='text-status-error bg-background/80 absolute inset-x-2 bottom-2 rounded p-2 text-xs'>
          {error}
        </p>
      )}
    </div>
  );
}
