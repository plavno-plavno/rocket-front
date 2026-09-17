'use client';

import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useQueryState } from 'nuqs';
import { parseAsStringLiteral } from 'nuqs';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon, SyncStatusDot } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { LinkButton } from '@/components/ui/link-button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/features/session';
import { useScope } from '@/hooks/use-scope';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { checkPlatformAccountMutation, startOAuthMutation } from '../api/mutations';
import { sourcesOverviewQueryOptions } from '../api/queries';
import type { ConnectorHealth, PlatformAccount, SourceOverview } from '../api/types';

const fail = (e: unknown) =>
  toast.error(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

const KINDS = ['all', 'map', 'navigator'] as const;
const kindParser = parseAsStringLiteral(KINDS).withDefault('all');

const HEALTH_TONE: Record<ConnectorHealth, string> = {
  ok: 'text-status-synced',
  degraded: 'text-status-action',
  down: 'text-status-error'
};
const ACCOUNT_TONE: Record<PlatformAccount['status'], string> = {
  ok: 'text-status-synced',
  reauth_required: 'text-status-action',
  challenge_required: 'text-status-action',
  revoked: 'text-status-error'
};

/** Platform card: listings synced / total, coverage, connector health (H-UI-09). */
function PlatformCard({ item }: { item: SourceOverview }) {
  const t = useTranslations('sources.page');
  const c = item.listing_counts;
  const pct = c.total ? Math.round((c.synced / c.total) * 100) : 0;
  return (
    <Card size='sm' data-testid='platform-card'>
      <CardContent className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <PlatformIcon
            platformId={item.platform.id}
            icon={item.platform.icon}
            className='size-5'
          />
          <span className='truncate font-medium'>{item.platform.name}</span>
          <Badge
            variant='outline'
            className={cn('ml-auto shrink-0 gap-1', HEALTH_TONE[item.platform.health])}
          >
            <span className='size-1.5 rounded-full bg-current' />
            {t(`health.${item.platform.health}`)}
          </Badge>
        </div>
        <div className='flex items-baseline gap-2'>
          <span className='text-2xl font-semibold tabular-nums'>{c.synced}</span>
          <span className='text-muted-foreground text-xs'>{t('card.of', { total: c.total })}</span>
        </div>
        <Progress value={pct} className='h-1.5' aria-label={t('card.synced')} />
        <div className='text-muted-foreground flex justify-between text-xs'>
          <span>{t('card.coverage', { percent: item.coverage_percent ?? 0 })}</span>
          <span>
            {item.accounts.length
              ? t('card.accounts', { count: item.accounts.length })
              : t('card.noAccounts')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** S-SRC-01 «Источники»: platform cards + accounts table + coverage table. */
export function SourcesOverview() {
  const t = useTranslations('sources.page');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [scope] = useScope();
  const [kind, setKind] = useQueryState('kind', kindParser.withOptions({ shallow: true }));
  const { data } = useSuspenseQuery(sourcesOverviewQueryOptions(scope ?? 'all'));
  const canManage = useCan('accounts.manage');
  const queryClient = useQueryClient();
  const check = useMutation(checkPlatformAccountMutation(queryClient));
  const oauth = useMutation(startOAuthMutation());

  const items = data.items.filter((i) => kind === 'all' || i.platform.kind === kind);
  const accounts = items.flatMap((i) =>
    i.accounts.map((a) => ({ account: a, platform: i.platform }))
  );

  return (
    <div className='flex flex-col gap-6'>
      <Tabs value={kind} onValueChange={(v) => void setKind(v as (typeof KINDS)[number])}>
        <TabsList>
          {KINDS.map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(`kinds.${k}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
        {items.map((item) => (
          <PlatformCard key={item.platform.id} item={item} />
        ))}
      </div>

      <section className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>{t('accounts')}</h3>
          <LinkButton href='/dashboard/settings/accounts' variant='outline' size='sm'>
            <Icons.settings className='size-4' /> {t('actions.manage')}
          </LinkButton>
        </div>
        {accounts.length === 0 ? (
          <Empty className='py-8'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icons.sources />
              </EmptyMedia>
              <EmptyTitle>{t('empty.accounts')}</EmptyTitle>
              <EmptyDescription>{t('empty.accountsHint')}</EmptyDescription>
            </EmptyHeader>
            <LinkButton href='/dashboard/settings/accounts'>{t('empty.goSettings')}</LinkButton>
          </Empty>
        ) : (
          <div className='overflow-hidden rounded-lg border'>
            <Table data-testid='accounts-table'>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>{t('columns.platform')}</TableHead>
                  <TableHead>{t('columns.account')}</TableHead>
                  <TableHead>{t('columns.authKind')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead className='text-right'>{t('columns.listings')}</TableHead>
                  <TableHead>{t('columns.lastChecked')}</TableHead>
                  {canManage && <TableHead className='w-0'>{t('columns.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map(({ account, platform }) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <span className='flex items-center gap-2'>
                        <PlatformIcon platformId={platform.id} icon={platform.icon} />
                        {platform.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='font-medium'>{account.display_name ?? '—'}</div>
                      {account.external_account_id && (
                        <div className='text-muted-foreground font-mono text-xs'>
                          {account.external_account_id}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {t(`authKind.${account.auth_kind}`)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={cn('gap-1', ACCOUNT_TONE[account.status])}
                      >
                        <span className='size-1.5 rounded-full bg-current' />
                        {t(`accountStatus.${account.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {account.listing_count}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-xs'>
                      {account.last_checked_at ? (
                        <time dateTime={account.last_checked_at}>
                          {format.relativeTime(new Date(account.last_checked_at), now)}
                        </time>
                      ) : (
                        t('actions.never')
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className='flex justify-end gap-1'>
                          {account.status !== 'ok' && account.auth_kind === 'oauth' && (
                            <Button
                              size='sm'
                              variant='outline'
                              disabled={oauth.isPending}
                              onClick={() =>
                                oauth.mutate(account.id, {
                                  onSuccess: (r) => window.location.assign(r.redirect_url),
                                  onError: fail
                                })
                              }
                            >
                              {t('actions.reconnect')}
                            </Button>
                          )}
                          <Button
                            size='sm'
                            variant='ghost'
                            disabled={check.isPending && check.variables === account.id}
                            onClick={() =>
                              check.mutate(account.id, {
                                onSuccess: () => {
                                  toast.success(t('actions.checked'));
                                  void queryClient.invalidateQueries({
                                    queryKey: sourcesOverviewQueryOptions(scope ?? 'all').queryKey
                                  });
                                },
                                onError: fail
                              })
                            }
                          >
                            {check.isPending && check.variables === account.id ? (
                              <Icons.spinner className='size-4 animate-spin' />
                            ) : (
                              <Icons.history className='size-4' />
                            )}
                            {t('actions.check')}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className='flex flex-col gap-3'>
        <h3 className='text-lg font-semibold'>{t('coverage')}</h3>
        <div className='overflow-hidden rounded-lg border'>
          <Table data-testid='coverage-table'>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>{t('columns.platform')}</TableHead>
                <TableHead className='text-right'>{t('columns.synced')}</TableHead>
                <TableHead className='text-right'>{t('columns.sent')}</TableHead>
                <TableHead className='text-right'>{t('columns.actionRequired')}</TableHead>
                <TableHead className='text-right'>{t('columns.error')}</TableHead>
                <TableHead className='text-right'>{t('columns.notConnected')}</TableHead>
                <TableHead className='w-40'>{t('columns.coverage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const c = item.listing_counts;
                return (
                  <TableRow key={item.platform.id}>
                    <TableCell>
                      <span className='flex items-center gap-2'>
                        <PlatformIcon platformId={item.platform.id} icon={item.platform.icon} />
                        {item.platform.name}
                      </span>
                    </TableCell>
                    {(['synced', 'sent', 'action_required', 'error', 'not_connected'] as const).map(
                      (s) => (
                        <TableCell key={s} className='text-right tabular-nums'>
                          <span className='inline-flex items-center gap-1.5'>
                            {c[s] > 0 && <SyncStatusDot status={s} />}
                            {c[s]}
                          </span>
                        </TableCell>
                      )
                    )}
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Progress value={item.coverage_percent ?? 0} className='h-1.5 flex-1' />
                        <span className='w-10 text-right text-xs tabular-nums'>
                          {item.coverage_percent ?? 0} %
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
