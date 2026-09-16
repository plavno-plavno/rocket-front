'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface RegionDatum {
  /** ISO 3166-2, e.g. `RU-MOW`. */
  code: string;
  name: string;
  value: number;
}

export interface RegionChoroplethProps {
  data: RegionDatum[];
  selected?: string | null;
  onSelect?: (code: string | null) => void;
  /** Value formatter for tooltips/legend. */
  format?: (v: number) => string;
  className?: string;
  height?: number;
}

/**
 * Foundation stub of the choropleth (SCR-4): renders a sortable "tile map" of regions with the
 * same props the real map will keep. UI-DS replaces the body with d3-geo + TopoJSON of RU
 * subjects (geodata licence to be checked, SDD-01 §4.1).
 */
export function RegionChoropleth({
  data,
  selected,
  onSelect,
  format = (v) => String(v),
  className,
  height = 320
}: RegionChoroplethProps) {
  const t = useTranslations('common');
  const max = Math.max(1, ...data.map((d) => d.value));
  const sorted = data.toSorted((a, b) => b.value - a.value);
  return (
    <div
      className={cn(
        'grid auto-rows-[minmax(56px,auto)] grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1 overflow-auto',
        className
      )}
      style={{ maxHeight: height }}
      role='list'
      aria-label={t('regions')}
      data-stub='region-choropleth'
    >
      {sorted.map((d) => {
        const intensity = d.value / max;
        return (
          <button
            key={d.code}
            type='button'
            onClick={() => onSelect?.(selected === d.code ? null : d.code)}
            aria-pressed={selected === d.code}
            title={`${d.name}: ${format(d.value)}`}
            className={cn(
              'flex flex-col items-start rounded-md border p-2 text-left text-xs transition-colors',
              selected === d.code && 'ring-primary ring-2'
            )}
            style={{
              backgroundColor: `color-mix(in oklch, var(--primary) ${Math.round(10 + intensity * 70)}%, var(--card))`,
              color: intensity > 0.55 ? 'var(--primary-foreground)' : 'var(--foreground)'
            }}
          >
            <span className='line-clamp-2 font-medium'>{d.name}</span>
            <span className='mt-auto tabular-nums opacity-80'>{format(d.value)}</span>
          </button>
        );
      })}
      {data.length === 0 && (
        <p className='text-muted-foreground col-span-full py-8 text-center text-sm'>
          {t('notFound')}
        </p>
      )}
    </div>
  );
}
