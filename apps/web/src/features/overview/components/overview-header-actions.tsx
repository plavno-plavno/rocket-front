'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { PeriodPicker } from '@/components/lp';
import { LinkButton } from '@/components/ui/link-button';
import { useCan } from '@/features/session';
import { useOverviewPeriod } from '../hooks/use-overview-period';

/** Header of S-OVR-01: period presets for the trend widgets + «Импорт» / «Добавить компанию». */
export function OverviewHeaderActions() {
  const t = useTranslations('overview.actions');
  const canEdit = useCan('locations.edit');
  const { period, setPeriod } = useOverviewPeriod();
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <PeriodPicker value={period} onChange={setPeriod} withGranularity />
      {canEdit && (
        <>
          <LinkButton href='/dashboard/locations/import' variant='outline' size='sm'>
            <Icons.upload className='size-4' /> {t('import')}
          </LinkButton>
          <LinkButton href='/dashboard/locations/new' size='sm'>
            <Icons.add className='size-4' /> {t('addLocation')}
          </LinkButton>
        </>
      )}
    </div>
  );
}
