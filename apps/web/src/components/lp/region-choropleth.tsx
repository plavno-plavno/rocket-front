'use client';

import { geoConicConformal, geoPath } from 'd3-geo';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
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
  /**
   * TopoJSON with an object `regions` whose features carry `properties.code` (ISO 3166-2) and
   * `properties.name`. Default: RU federal subjects built from Natural Earth (public domain) by
   * `pnpm geo:build`. Pass another topology for other countries.
   */
  geoUrl?: string;
}

type RegionProps = { code: string; name: string; name_en?: string };
type RegionFC = FeatureCollection<Geometry, RegionProps>;

const cache = new Map<string, Promise<RegionFC>>();

function loadRegions(url: string): Promise<RegionFC> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`geo ${r.status}`);
        return r.json() as Promise<Topology>;
      })
      .then((topo) => feature(topo, topo.objects.regions) as unknown as RegionFC);
    cache.set(url, p);
  }
  return p;
}

const WIDTH = 960;
const HEIGHT = 520;

/**
 * Choropleth of regions (SCR-4): d3-geo conic projection over a TopoJSON, fill intensity by value,
 * click = filter; keyboard accessible (each region is a focusable button). Falls back to a tile
 * list while the geometry loads or when it is unavailable.
 */
export function RegionChoropleth({
  data,
  selected,
  onSelect,
  format = (v) => String(v),
  className,
  height = 420,
  geoUrl = '/geo/ru-regions.topo.json'
}: RegionChoroplethProps) {
  const t = useTranslations('common');
  const [regions, setRegions] = useState<RegionFC | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadRegions(geoUrl)
      .then((fc) => alive && setRegions(fc))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [geoUrl]);

  const byCode = useMemo(() => new Map(data.map((d) => [d.code, d])), [data]);
  const max = Math.max(1, ...data.map((d) => d.value));

  const paths = useMemo(() => {
    if (!regions) return null;
    // Conic conformal centred on Russia keeps Chukotka on the right side of the antimeridian.
    const projection = geoConicConformal()
      .rotate([-105, 0])
      .parallels([52, 64])
      .fitSize([WIDTH, HEIGHT], regions);
    const path = geoPath(projection);
    return regions.features.map((f) => ({
      code: f.properties.code,
      name: f.properties.name,
      d: path(f) ?? ''
    }));
  }, [regions]);

  if (failed || !paths)
    return (
      <TileFallback
        data={data}
        selected={selected}
        onSelect={onSelect}
        format={format}
        className={className}
        height={height}
        loading={!failed}
        label={t('regions')}
        empty={t('notFound')}
      />
    );

  return (
    <div className={cn('relative w-full', className)} style={{ height }} data-choropleth='svg'>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className='h-full w-full'
        role='group'
        aria-label={t('regions')}
      >
        {paths.map((p) => {
          const datum = byCode.get(p.code);
          const intensity = datum ? datum.value / max : 0;
          const isSelected = selected === p.code;
          const label = `${datum?.name ?? p.name}: ${datum ? format(datum.value) : '—'}`;
          return (
            <path
              key={p.code}
              d={p.d}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect && datum ? 0 : -1}
              aria-label={label}
              aria-pressed={onSelect ? isSelected : undefined}
              onClick={() => datum && onSelect?.(isSelected ? null : p.code)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && datum) {
                  e.preventDefault();
                  onSelect?.(isSelected ? null : p.code);
                }
              }}
              className={cn(
                'stroke-background transition-colors outline-none focus-visible:stroke-ring',
                datum && onSelect && 'cursor-pointer hover:opacity-80',
                isSelected && 'stroke-primary stroke-2'
              )}
              style={{
                fill: datum
                  ? `color-mix(in oklch, var(--primary) ${Math.round(12 + intensity * 78)}%, var(--card))`
                  : 'var(--muted)',
                strokeWidth: isSelected ? 2 : 0.6
              }}
            >
              <title>{label}</title>
            </path>
          );
        })}
      </svg>
      <div className='text-muted-foreground absolute right-2 bottom-2 flex items-center gap-2 text-[11px]'>
        <span>{format(0)}</span>
        <span
          className='h-2 w-24 rounded-sm'
          style={{
            background:
              'linear-gradient(to right, color-mix(in oklch, var(--primary) 12%, var(--card)), color-mix(in oklch, var(--primary) 90%, var(--card)))'
          }}
          aria-hidden
        />
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function TileFallback({
  data,
  selected,
  onSelect,
  format,
  className,
  height,
  loading,
  label,
  empty
}: Required<Pick<RegionChoroplethProps, 'data' | 'format' | 'height'>> &
  Pick<RegionChoroplethProps, 'selected' | 'onSelect' | 'className'> & {
    loading: boolean;
    label: string;
    empty: string;
  }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const sorted = data.toSorted((a, b) => b.value - a.value);
  return (
    <div
      className={cn(
        'grid auto-rows-[minmax(56px,auto)] grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1 overflow-auto',
        loading && 'animate-pulse',
        className
      )}
      style={{ maxHeight: height }}
      role='group'
      aria-label={label}
      aria-busy={loading}
      data-choropleth='tiles'
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
        <p className='text-muted-foreground col-span-full py-8 text-center text-sm'>{empty}</p>
      )}
    </div>
  );
}
