'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { ActionRequiredList, locationsQueryOptions } from '@/features/locations';
import { PresenceTrendCard } from '@/features/presence';
import { ReviewsTrendCard } from '@/features/review-analytics';
import { RecentReviewsList } from '@/features/reviews';
import { useCan } from '@/features/session';
import { useOverviewPeriod } from '../hooks/use-overview-period';

export function ReviewsTrendWidget() {
  const { period, scope } = useOverviewPeriod();
  return (
    <ReviewsTrendCard
      scope={scope}
      from={period.from}
      to={period.to}
      granularity={period.granularity}
    />
  );
}

export function PresenceTrendWidget() {
  const { period, scope } = useOverviewPeriod();
  return (
    <PresenceTrendCard
      scope={scope}
      from={period.from}
      to={period.to}
      granularity={period.granularity}
    />
  );
}

export function RecentReviewsWidget() {
  const t = useTranslations('overview.widgets');
  const { scope } = useOverviewPeriod();
  return (
    <Card data-testid='widget-recent-reviews'>
      <CardHeader>
        <CardTitle>{t('recentReviews')}</CardTitle>
        <CardAction>
          <LinkButton variant='ghost' size='sm' href='/dashboard/reviews'>
            {t('all')}
          </LinkButton>
        </CardAction>
      </CardHeader>
      <CardContent>
        <RecentReviewsList scope={scope} limit={5} />
      </CardContent>
    </Card>
  );
}

export function ActionRequiredWidget() {
  const t = useTranslations('overview.widgets');
  const { scope } = useOverviewPeriod();
  return (
    <Card data-testid='widget-action-required'>
      <CardHeader>
        <CardTitle>{t('actionRequired')}</CardTitle>
        <CardAction>
          <LinkButton
            variant='ghost'
            size='sm'
            href='/dashboard/locations?syncStatus=action_required'
          >
            {t('all')}
          </LinkButton>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ActionRequiredList scope={scope} limit={5} />
      </CardContent>
    </Card>
  );
}

/**
 * Empty-tenant welcome (S-OVR-01 «пустые состояния»): no locations yet → three first steps and a
 * link to the onboarding wizard. Renders nothing once at least one location exists.
 */
export function WelcomeWidget() {
  const t = useTranslations('overview.welcome');
  const canEdit = useCan('locations.edit');
  const { data } = useQuery(locationsQueryOptions({ scope: 'all', page: 1, page_size: 1 }));
  if (!data || data.meta.total > 0) return null;
  const steps = [
    { icon: 'locations', key: 'locations', href: '/dashboard/locations/import' },
    { icon: 'sources', key: 'platforms', href: '/dashboard/settings/accounts' },
    { icon: 'teams', key: 'team', href: '/dashboard/settings/users' }
  ] as const;
  return (
    <Card className='border-primary/30 bg-primary/5' data-testid='widget-welcome'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
        <CardAction>
          <LinkButton href='/dashboard/onboarding' size='sm'>
            <Icons.rocket className='size-4' /> {t('start')}
          </LinkButton>
        </CardAction>
      </CardHeader>
      <CardContent className='grid gap-3 sm:grid-cols-3'>
        {steps.map((s, i) => {
          const Icon = Icons[s.icon];
          return (
            <div key={s.key} className='bg-card flex items-start gap-3 rounded-lg border p-3'>
              <span className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
                {i + 1}
              </span>
              <div className='min-w-0'>
                <div className='flex items-center gap-1.5 font-medium'>
                  <Icon className='size-4' /> {t(`steps.${s.key}.title`)}
                </div>
                <p className='text-muted-foreground text-xs'>{t(`steps.${s.key}.hint`)}</p>
                {canEdit && (
                  <LinkButton href={s.href} variant='ghost' size='sm' className='mt-1 h-7 px-2'>
                    {t(`steps.${s.key}.cta`)}
                  </LinkButton>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
