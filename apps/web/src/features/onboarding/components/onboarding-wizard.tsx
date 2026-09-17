'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { PlatformIcon, WizardPage } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { Skeleton } from '@/components/ui/skeleton';
import { locationsQueryOptions } from '@/features/locations';
import { useCan } from '@/features/session';
import { ConnectAccountDialog } from '@/features/settings';
import { platformAccountsQueryOptions, platformsQueryOptions } from '@/features/sources';
import { UserSheet, invitationsQueryOptions, usersQueryOptions } from '@/features/users';
import { cn } from '@/lib/utils';
import { useBreadcrumbTitle } from '@/shell/breadcrumb-store';

const STEPS = ['locations', 'platforms', 'team'] as const;
const stepParser = parseAsInteger.withDefault(0);

function StepCard({
  done,
  title,
  description,
  children
}: {
  done: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const t = useTranslations('onboarding');
  return (
    <Card className={cn(done && 'border-status-synced/50')}>
      <CardHeader>
        <div className='flex items-center justify-between gap-3'>
          <CardTitle>{title}</CardTitle>
          {done && (
            <Badge variant='outline' className='text-status-synced gap-1'>
              <Icons.circleCheck className='size-3.5' /> {t('done')}
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>{children}</CardContent>
    </Card>
  );
}

/** S-ONB-01 «Онбординг»: import locations → connect platforms → invite the team; progress lives in `?step=`. */
export function OnboardingWizard() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  useBreadcrumbTitle('/dashboard/onboarding', t('page.title'));
  const [step, setStep] = useQueryState('step', stepParser.withOptions({ shallow: true }));
  const canLocations = useCan('locations.edit');
  const canAccounts = useCan('accounts.manage');
  const canUsers = useCan('users.manage');
  const [connectOpen, setConnectOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: locations } = useQuery(locationsQueryOptions({ page: 1, page_size: 1 }));
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data: accounts } = useQuery(platformAccountsQueryOptions());
  const { data: members } = useQuery(usersQueryOptions({ page: 1, page_size: 1 }));
  const { data: invitations } = useQuery(invitationsQueryOptions({ page: 1, page_size: 1 }));

  const locationCount = locations?.meta.total ?? null;
  const accountCount = accounts?.items.length ?? null;
  const teamCount = members && invitations ? members.meta.total - 1 + invitations.meta.total : null;
  const done = [(locationCount ?? 0) > 0, (accountCount ?? 0) > 0, (teamCount ?? 0) > 0];
  const current = Math.min(Math.max(step, 0), STEPS.length - 1);
  const last = current === STEPS.length - 1;

  const steps = STEPS.map((id) => ({ id, title: t(`steps.${id}.title`) }));

  return (
    <WizardPage
      title={t('page.title')}
      description={t('page.description')}
      steps={steps}
      current={current}
      footer={
        <>
          <Button variant='ghost' onClick={() => router.push('/dashboard/overview')}>
            {t('skipAll')}
          </Button>
          <Button variant='outline' disabled={current === 0} onClick={() => setStep(current - 1)}>
            <Icons.chevronLeft className='size-4' /> {t('back')}
          </Button>
          {last ? (
            <Button
              onClick={() => router.push('/dashboard/overview')}
              data-testid='onboarding-finish'
            >
              {t('finish')} <Icons.arrowRight className='size-4' />
            </Button>
          ) : (
            <Button onClick={() => setStep(current + 1)} data-testid='onboarding-next'>
              {t('next')} <Icons.chevronRight className='size-4' />
            </Button>
          )}
        </>
      }
    >
      <div className='max-w-3xl' data-testid={`onboarding-step-${STEPS[current]}`}>
        {current === 0 && (
          <StepCard
            done={done[0]!}
            title={t('steps.locations.title')}
            description={t('steps.locations.description')}
          >
            {locationCount === null ? (
              <Skeleton className='h-5 w-48' />
            ) : (
              <p className='text-sm'>
                {locationCount > 0
                  ? t('steps.locations.have', { count: locationCount })
                  : t('steps.locations.none')}
              </p>
            )}
            {canLocations ? (
              <div className='flex flex-wrap gap-2'>
                <LinkButton href='/dashboard/locations/import?from=onboarding'>
                  <Icons.upload className='size-4' /> {t('steps.locations.import')}
                </LinkButton>
                <LinkButton href='/dashboard/locations/new' variant='outline'>
                  <Icons.add className='size-4' /> {t('steps.locations.manual')}
                </LinkButton>
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>{t('noPermission')}</p>
            )}
            <p className='text-muted-foreground text-xs'>{t('steps.locations.hint')}</p>
          </StepCard>
        )}

        {current === 1 && (
          <StepCard
            done={done[1]!}
            title={t('steps.platforms.title')}
            description={t('steps.platforms.description')}
          >
            <ul className='divide-y rounded-md border'>
              {(platforms?.items ?? []).map((p) => {
                const connected = (accounts?.items ?? []).filter((a) => a.platform_id === p.id);
                return (
                  <li key={p.id} className='flex items-center gap-3 px-3 py-2'>
                    <PlatformIcon platformId={p.id} icon={p.icon} />
                    <span className='flex-1 text-sm font-medium'>{p.name}</span>
                    {connected.length > 0 ? (
                      <Badge variant='outline' className='text-status-synced gap-1'>
                        <Icons.circleCheck className='size-3.5' />
                        {t('steps.platforms.connected', { count: connected.length })}
                      </Badge>
                    ) : (
                      <span className='text-muted-foreground text-xs'>
                        {t('steps.platforms.notConnected')}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {canAccounts ? (
              <div>
                <Button onClick={() => setConnectOpen(true)} data-testid='onboarding-connect'>
                  <Icons.add className='size-4' /> {t('steps.platforms.connect')}
                </Button>
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>{t('noPermission')}</p>
            )}
            <p className='text-muted-foreground text-xs'>{t('steps.platforms.hint')}</p>
            <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
          </StepCard>
        )}

        {current === 2 && (
          <StepCard
            done={done[2]!}
            title={t('steps.team.title')}
            description={t('steps.team.description')}
          >
            {teamCount === null ? (
              <Skeleton className='h-5 w-48' />
            ) : (
              <p className='text-sm'>
                {teamCount > 0 ? t('steps.team.have', { count: teamCount }) : t('steps.team.none')}
              </p>
            )}
            {canUsers ? (
              <div>
                <Button onClick={() => setInviteOpen(true)} data-testid='onboarding-invite'>
                  <Icons.userPlus className='size-4' /> {t('steps.team.invite')}
                </Button>
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>{t('noPermission')}</p>
            )}
            <p className='text-muted-foreground text-xs'>{t('steps.team.hint')}</p>
            <UserSheet open={inviteOpen} onOpenChange={setInviteOpen} member={null} />
          </StepCard>
        )}
      </div>
    </WizardPage>
  );
}
