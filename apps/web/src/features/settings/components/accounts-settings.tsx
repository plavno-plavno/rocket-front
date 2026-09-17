'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  checkPlatformAccountMutation,
  createPlatformAccountMutation,
  deletePlatformAccountMutation,
  platformAccountsQueryOptions,
  platformsQueryOptions,
  sourceKeys,
  startOAuthMutation,
  type PlatformAccount
} from '@/features/sources';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

const AUTH_KINDS = ['oauth', 'partner_key', 'credentials'] as const;
type AuthKind = (typeof AUTH_KINDS)[number];

const STATUS_TONE: Record<PlatformAccount['status'], string> = {
  ok: 'text-status-synced',
  reauth_required: 'text-status-action',
  challenge_required: 'text-status-action',
  revoked: 'text-status-error'
};

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

export function ConnectAccountDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const t = useTranslations('settings.accounts.connect');
  const ta = useTranslations('settings.accounts.authKind');
  const queryClient = useQueryClient();
  const { data: platforms } = useQuery({ ...platformsQueryOptions(), enabled: open });
  const create = useMutation(createPlatformAccountMutation(queryClient));
  const oauth = useMutation(startOAuthMutation());
  const [platformId, setPlatformId] = useState('');
  const [authKind, setAuthKind] = useState<AuthKind>('oauth');
  const [displayName, setDisplayName] = useState('');
  const [key, setKey] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPlatformId('');
    setAuthKind('oauth');
    setDisplayName('');
    setKey('');
    setLogin('');
    setPassword('');
    setError(null);
  }, [open]);

  const pending = create.isPending || oauth.isPending;
  const submit = async () => {
    if (!platformId) return setError(t('platformRequired'));
    if (authKind === 'partner_key' && !key.trim()) return setError(t('keyRequired'));
    if (authKind === 'credentials' && (!login.trim() || !password))
      return setError(t('credentialsRequired'));
    const credentials: Record<string, string> | undefined =
      authKind === 'partner_key'
        ? { key: key.trim() }
        : authKind === 'credentials'
          ? { login: login.trim(), password }
          : undefined;
    try {
      const account = await create.mutateAsync({
        platform_id: platformId,
        auth_kind: authKind,
        ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
        ...(credentials ? { credentials } : {})
      });
      if (authKind === 'oauth') {
        const r = await oauth.mutateAsync(account.id);
        window.location.assign(r.redirect_url);
        return;
      }
      toast.success(t('connected'));
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid='connect-dialog'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <Field>
            <FieldLabel htmlFor='connect-platform'>{t('platform')}</FieldLabel>
            <Select value={platformId} onValueChange={(v) => setPlatformId(v ?? '')}>
              <SelectTrigger id='connect-platform' aria-label={t('platform')}>
                <SelectValue placeholder={t('platformPlaceholder')}>
                  {(id: string) => platforms?.items.find((p) => p.id === id)?.name ?? ''}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
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
          </Field>
          <Field>
            <FieldLabel htmlFor='connect-auth'>{t('authKind')}</FieldLabel>
            <Select value={authKind} onValueChange={(v) => setAuthKind((v as AuthKind) ?? 'oauth')}>
              <SelectTrigger id='connect-auth' aria-label={t('authKind')}>
                <SelectValue>{(v: string) => ta(v as AuthKind)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AUTH_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {ta(k)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>{t(`authHint.${authKind}`)}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor='connect-name'>{t('displayName')}</FieldLabel>
            <Input
              id='connect-name'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
            />
          </Field>
          {authKind === 'partner_key' && (
            <Field>
              <FieldLabel htmlFor='connect-key'>{t('key')}</FieldLabel>
              <Input
                id='connect-key'
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete='off'
              />
            </Field>
          )}
          {authKind === 'credentials' && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field>
                <FieldLabel htmlFor='connect-login'>{t('login')}</FieldLabel>
                <Input
                  id='connect-login'
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  autoComplete='off'
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='connect-password'>{t('password')}</FieldLabel>
                <Input
                  id='connect-password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete='new-password'
                />
              </Field>
            </div>
          )}
          {error && <FieldError>{error}</FieldError>}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending} data-testid='connect-submit'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {authKind === 'oauth' ? t('submitOauth') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** S-SET-03 «Аккаунты площадок»: connect (OAuth / partner key / credentials), re-check, reconnect, remove. */
export function AccountsSettings() {
  const t = useTranslations('settings.accounts');
  const tc = useTranslations('common');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: accounts, isPending } = useQuery(platformAccountsQueryOptions());
  const { data: platforms } = useQuery(platformsQueryOptions());
  const check = useMutation(checkPlatformAccountMutation(queryClient));
  const oauth = useMutation(startOAuthMutation());
  const remove = useMutation(deletePlatformAccountMutation(queryClient));
  const [connectOpen, setConnectOpen] = useState(false);
  const [deleting, setDeleting] = useState<PlatformAccount | null>(null);

  // Return from the OAuth provider: `?oauth=ok` (or `?oauth=error`).
  useEffect(() => {
    const result = searchParams.get('oauth');
    if (!result) return;
    if (result === 'ok') toast.success(t('oauthOk'));
    else toast.error(t('oauthFailed'));
    void queryClient.invalidateQueries({ queryKey: sourceKeys.all });
    router.replace('/dashboard/settings/accounts');
  }, [searchParams, router, queryClient, t]);

  const items = (accounts?.items ?? []).map((account) => ({
    account,
    platform: platforms?.items.find((p) => p.id === account.platform_id)
  }));
  const problems = items.filter(({ account }) => account.status !== 'ok');

  return (
    <div className='flex flex-col gap-4' data-testid='accounts-settings'>
      {problems.length > 0 && (
        <Alert variant='destructive'>
          <Icons.alertCircle className='size-4' />
          <AlertTitle>{t('problems.title', { count: problems.length })}</AlertTitle>
          <AlertDescription>{t('problems.body')}</AlertDescription>
        </Alert>
      )}
      <div className='flex items-center justify-between gap-2'>
        <p className='text-muted-foreground text-sm'>{t('hint')}</p>
        <Button size='sm' onClick={() => setConnectOpen(true)} data-testid='connect-open'>
          <Icons.add className='size-4' /> {t('actions.connect')}
        </Button>
      </div>
      <div className='overflow-x-auto rounded-lg border'>
        <Table data-testid='accounts-table'>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>{t('columns.platform')}</TableHead>
              <TableHead>{t('columns.account')}</TableHead>
              <TableHead>{t('columns.authKind')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead className='text-right'>{t('columns.listings')}</TableHead>
              <TableHead>{t('columns.lastChecked')}</TableHead>
              <TableHead className='w-0 text-right'>{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Empty className='py-8'>
                    <EmptyHeader>
                      <EmptyMedia variant='icon'>
                        <Icons.sources />
                      </EmptyMedia>
                      <EmptyTitle>{t('empty.title')}</EmptyTitle>
                      <EmptyDescription>{t('empty.hint')}</EmptyDescription>
                    </EmptyHeader>
                    <Button onClick={() => setConnectOpen(true)}>{t('actions.connect')}</Button>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {items.map(({ account, platform }) => (
              <TableRow key={account.id} data-status={account.status}>
                <TableCell>
                  <span className='flex items-center gap-2'>
                    <PlatformIcon platformId={account.platform_id} icon={platform?.icon ?? null} />
                    {platform?.name ?? account.platform_id}
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
                  <Badge variant='outline' className={cn('gap-1', STATUS_TONE[account.status])}>
                    <span className='size-1.5 rounded-full bg-current' aria-hidden />
                    {t(`status.${account.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className='text-right tabular-nums'>{account.listing_count}</TableCell>
                <TableCell className='text-muted-foreground text-xs'>
                  {account.last_checked_at ? (
                    <time dateTime={account.last_checked_at}>
                      {format.relativeTime(new Date(account.last_checked_at), now)}
                    </time>
                  ) : (
                    t('actions.never')
                  )}
                </TableCell>
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
                            onError: (e) => toast.error(errorText(e))
                          })
                        }
                      >
                        <Icons.refresh className='size-4' /> {t('actions.reconnect')}
                      </Button>
                    )}
                    {account.status === 'challenge_required' && account.auth_kind !== 'oauth' && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => toast.info(t('challengeHint'))}
                      >
                        <Icons.help className='size-4' /> {t('actions.instructions')}
                      </Button>
                    )}
                    <Button
                      size='sm'
                      variant='ghost'
                      disabled={check.isPending && check.variables === account.id}
                      onClick={() =>
                        check.mutate(account.id, {
                          onSuccess: () => toast.success(t('actions.checked')),
                          onError: (e) => toast.error(errorText(e))
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
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={t('actions.remove')}
                      onClick={() => setDeleting(account)}
                    >
                      <Icons.trash className='size-3.5' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title={t('actions.remove')}
        description={
          deleting
            ? t('removeConfirm', {
                name: deleting.display_name ?? deleting.id,
                count: deleting.listing_count
              })
            : ''
        }
        confirmLabel={tc('delete')}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(t('actions.removed'));
              setDeleting(null);
            },
            onError: (e) => toast.error(errorText(e))
          })
        }
      />
    </div>
  );
}
