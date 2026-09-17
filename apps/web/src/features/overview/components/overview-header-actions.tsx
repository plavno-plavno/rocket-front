'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { PeriodPicker } from '@/components/lp';
import { LinkButton } from '@/components/ui/link-button';
import { useCan } from '@/features/session';
import { useOverviewPeriod } from '../hooks/use-overview-period';

/**
 * Toolbar of S-OVR-01 under the page heading: «Импорт» / «Добавить компанию» on the left edge (under
 * the title), period presets for the trend widgets on the right; everything wraps left on narrow screens.
 */
export function OverviewHeaderActions() {
  const t = useTranslations('overview.actions');
  const canEdit = useCan('locations.edit');
  const { period, setPeriod } = useOverviewPeriod();
  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      {canEdit && (
        <div className='flex flex-wrap items-center gap-2'>
          <LinkButton href='/dashboard/locations/import' variant='outline' size='sm'>
            <Icons.upload className='size-4' /> {t('import')}
          </LinkButton>
          <LinkButton href='/dashboard/locations/new' size='sm'>
            <Icons.add className='size-4' /> {t('addLocation')}
          </LinkButton>
        </div>
      )}
      <PeriodPicker value={period} onChange={setPeriod} withGranularity />
    </div>
  );
}
