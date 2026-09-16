'use client';

import { useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionRequiredList } from '@/features/locations';
import { PresenceTrendCard } from '@/features/presence';
import { ReviewsTrendCard } from '@/features/review-analytics';
import { RecentReviewsList } from '@/features/reviews';
import { useScope } from '@/hooks/use-scope';

export function ReviewsTrendWidget() {
  const [scope] = useScope();
  return <ReviewsTrendCard scope={scope} />;
}

export function PresenceTrendWidget() {
  const [scope] = useScope();
  return <PresenceTrendCard scope={scope} />;
}

export function RecentReviewsWidget() {
  const t = useTranslations('overview.widgets');
  const [scope] = useScope();
  return (
    <Card>
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
  const [scope] = useScope();
  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between'>
        <CardTitle>{t('actionRequired')}</CardTitle>
        <LinkButton
          variant='ghost'
          size='sm'
          href='/dashboard/locations?syncStatus=action_required'
        >
          {t('all')}
        </LinkButton>
      </CardHeader>
      <CardContent>
        <ActionRequiredList scope={scope} limit={5} />
      </CardContent>
    </Card>
  );
}
