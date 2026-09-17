'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PeriodPicker, PlatformIcon } from '@/components/lp';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { locationGroupsQueryOptions } from '@/features/locations';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { exportReviewAnalyticsMutation } from '../api/mutations';
import { getExport } from '../api/service';
import { useAnalyticsParams } from '../hooks/use-analytics-params';
import { waitForExport } from '../lib/export';

const ALL = '__all__';

/** Header actions of every analytics screen: `PeriodPicker` (+ granularity / compare) and «Скачать отчёт». */
export function AnalyticsActions({
  withGranularity = true,
  withCompare = true,
  exportKind = 'review_analytics'
}: {
  withGranularity?: boolean;
  withCompare?: boolean;
  exportKind?: 'review_analytics';
}) {
  const t = useTranslations('review-analytics.actions');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const { period, setPeriod, query, filters } = useAnalyticsParams();
  const exp = useMutation(exportReviewAnalyticsMutation(queryClient));

  const download = async () => {
    const id = toast.loading(t('exportStarted'));
    try {
      const { scope, ...rest } = query;
      const started = await exp.mutateAsync({
        body: { kind: exportKind, format: 'xlsx', params: { ...rest, ...filters } },
        params: { scope }
      });
      const done = await waitForExport(getExport, started.id);
      toast.success(tc('exportReady'), {
        id,
        action: { label: tc('download'), onClick: () => window.open(done.download_url!, '_blank') }
      });
    } catch (e) {
      toast.error(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message, { id });
    }
  };

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <PeriodPicker
        value={period}
        onChange={setPeriod}
        withGranularity={withGranularity}
        withCompare={withCompare}
      />
      <Button
        variant='outline'
        size='sm'
        onClick={download}
        disabled={exp.isPending}
        data-testid='analytics-export'
      >
        <Icons.download className='size-4' /> {t('export')}
      </Button>
    </div>
  );
}

/** Inline filters row: region / brand / city (location groups) + platform (SDD-01 §8 S-ANL-01). */
export function AnalyticsFilters() {
  const t = useTranslations('review-analytics.filters');
  const { filters, setFilters } = useAnalyticsParams();
  const { data: groups } = useQuery(locationGroupsQueryOptions());
  const { data: platforms } = useQuery(platformsQueryOptions());
  const byKind = (kind: string) => (groups?.items ?? []).filter((g) => g.kind === kind);
  const active =
    !!filters.region || !!filters.brand || !!filters.city || filters.platform.length > 0;

  const select = (
    key: 'region' | 'brand' | 'city',
    options: { value: string; label: string }[],
    label: string
  ) => (
    <Select
      value={filters[key] || ALL}
      onValueChange={(v) => setFilters({ [key]: !v || v === ALL ? '' : v })}
    >
      <SelectTrigger className='h-8 min-w-40' aria-label={label} data-testid={`filter-${key}`}>
        <SelectValue>
          {(v: string) => (v === ALL ? label : (options.find((o) => o.value === v)?.label ?? v))}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t('any', { what: label })}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className='flex flex-wrap items-center gap-2' data-testid='analytics-filters'>
      {select(
        'region',
        byKind('region').map((g) => ({ value: g.name, label: g.name })),
        t('region')
      )}
      {select(
        'brand',
        byKind('brand').map((g) => ({ value: g.id, label: g.name })),
        t('brand')
      )}
      {select(
        'city',
        byKind('city').map((g) => ({ value: g.name, label: g.name })),
        t('city')
      )}
      <Select
        value={filters.platform[0] ?? ALL}
        onValueChange={(v) => setFilters({ platform: !v || v === ALL ? [] : [v] })}
      >
        <SelectTrigger
          className='h-8 min-w-40'
          aria-label={t('platform')}
          data-testid='filter-platform'
        >
          <SelectValue>
            {(v: string) =>
              v === ALL ? t('platform') : (platforms?.items.find((p) => p.id === v)?.name ?? v)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('any', { what: t('platform') })}</SelectItem>
          {(platforms?.items ?? []).map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className='flex items-center gap-2'>
                <PlatformIcon platformId={p.id} icon={p.icon} />
                {p.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {active && (
        <Button
          variant='ghost'
          size='sm'
          className='h-8'
          onClick={() => setFilters({ region: '', brand: '', city: '', platform: [] })}
        >
          <Icons.close className='size-4' /> {t('reset')}
        </Button>
      )}
    </div>
  );
}
