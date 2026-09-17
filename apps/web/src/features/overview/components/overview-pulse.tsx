'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { LinkButton } from '@/components/ui/link-button';
import { listingsSummaryQueryOptions } from '@/features/locations';
import { useMe } from '@/features/session';
import { useScope } from '@/hooks/use-scope';
import { usePanelMotion } from '@/hooks/use-panel-motion';

/** Network health uses the same scoped summary as the actionable KPI cards. */
export function OverviewPulse() {
  const welcomeRef = usePanelMotion();
  const healthRef = usePanelMotion(true, true);
  const t = useTranslations('overview.pulse');
  const format = useFormatter();
  const me = useMe();
  const [scope] = useScope();
  const { data, isError } = useQuery(listingsSummaryQueryOptions(scope));
  const counts = data?.counts;
  const ratio = counts && counts.total > 0 ? counts.synced / counts.total : null;
  const percentage =
    ratio === null ? '—' : format.number(ratio, { style: 'percent', maximumFractionDigits: 0 });
  return (
    <section className='lp-pulse grid gap-5 xl:grid-cols-[1.6fr_1fr]' aria-label={t('label')}>
      <div
        ref={welcomeRef}
        className='lp-welcome-panel relative flex min-h-52 flex-col justify-between overflow-hidden rounded-3xl p-6 sm:p-7'
      >
        <div className='relative z-10 max-w-md'>
          <p className='mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase'>
            <span className='size-2 rounded-full bg-current' />
            {me.tenant.name}
          </p>
          <h3 className='text-2xl leading-tight font-semibold tracking-tight sm:text-3xl'>
            {t('title')}
          </h3>
          <p className='mt-3 max-w-sm text-sm leading-relaxed opacity-80'>{t('description')}</p>
        </div>
        <LinkButton
          href={`/dashboard/locations?scope=${encodeURIComponent(scope)}`}
          variant='outline'
          size='sm'
          className='relative z-10 mt-5 w-fit rounded-full border-current/15 bg-card/75'
        >
          {t('locations')}
          <Icons.arrowRight className='size-4' />
        </LinkButton>
        <div aria-hidden className='lp-orbit'>
          <div className='lp-orbit-inner' />
          <span className='lp-orbit-pin'>
            <Icons.mapPin className='size-10' />
          </span>
          <span className='lp-orbit-star'>
            <Icons.star className='size-5' />
          </span>
        </div>
      </div>
      <div
        ref={healthRef}
        className='lp-health-panel flex items-center justify-between gap-4 rounded-3xl p-6 sm:p-7'
      >
        <div className='min-w-0'>
          <span className='mb-4 inline-flex rounded-full border border-white/20 p-2'>
            <Icons.globe className='size-5' />
          </span>
          <h3 className='text-lg font-semibold'>{t('health')}</h3>
          <p className='mt-2 max-w-48 text-sm leading-relaxed text-white/75'>
            {counts
              ? t('summary', {
                  synced: format.number(counts.synced),
                  total: format.number(counts.total)
                })
              : t(isError ? 'unavailable' : 'pending')}
          </p>
        </div>
        <div className='relative size-32 shrink-0'>
          <svg viewBox='0 0 120 120' className='size-full -rotate-90' aria-hidden>
            <circle
              cx='60'
              cy='60'
              r='50'
              fill='none'
              stroke='currentColor'
              strokeWidth='8'
              className='text-white/15'
            />
            <circle
              cx='60'
              cy='60'
              r='50'
              fill='none'
              stroke='currentColor'
              strokeWidth='8'
              pathLength='100'
              strokeDasharray={`${(ratio ?? 0) * 100} 100`}
              strokeLinecap='round'
              className='text-emerald-300'
            />
          </svg>
          <span className='absolute inset-0 flex items-center justify-center text-3xl font-semibold tracking-tight tabular-nums'>
            {percentage}
          </span>
        </div>
      </div>
    </section>
  );
}
