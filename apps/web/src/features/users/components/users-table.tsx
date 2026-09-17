'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
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
import { useMe, type Role } from '@/features/session';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  removeUserMutation,
  resendInvitationMutation,
  revokeInvitationMutation,
  updateUserMutation
} from '../api/mutations';
import { invitationsQueryOptions, usersQueryOptions } from '../api/queries';
import type { Invitation, Membership } from '../api/types';
import { UserSheet } from './user-sheet';

const ROLES: Role[] = ['owner', 'admin', 'reputation_manager', 'observer'];
const ALL = '__all__';
const WEEK = 7 * 86_400_000;

const STATUS_TONE: Record<Membership['status'], string> = {
  active: 'text-status-synced',
  invited: 'text-status-sent',
  disabled: 'text-muted-foreground'
};

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function ScopeBadge({ rule }: { rule: Membership['access_rule'] }) {
  const t = useTranslations('users.scope');
  if (rule.mode === 'all') return <Badge variant='outline'>{t('all')}</Badge>;
  const count = (rule.location_ids?.length ?? 0) + (rule.group_ids?.length ?? 0);
  if (count === 0)
    return (
      <Badge variant='outline' className='text-muted-foreground'>
        {t('none')}
      </Badge>
    );
  return (
    <Badge variant='outline'>
      {rule.mode === 'groups' ? t('groups', { count }) : t('locations', { count })}
    </Badge>
  );
}

/** S-SET-01 «Пользователи»: members table + pending invitations, invite / edit sheet, row actions. */
export function UsersTable() {
  const t = useTranslations('users.table');
  const tr = useTranslations('users.roles');
  const ta = useTranslations('users.actions');
  const tc = useTranslations('common');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const me = useMe();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Membership | null>(null);
  const [removing, setRemoving] = useState<Membership | null>(null);
  const [revoking, setRevoking] = useState<Invitation | null>(null);

  const { data, isPending } = useQuery(
    usersQueryOptions({
      page: 1,
      page_size: 200,
      ...(search.trim() ? { q: search.trim() } : {}),
      ...(role !== ALL ? { 'filter[role]': role as Role } : {}),
      ...(status !== ALL ? { 'filter[status]': status as Membership['status'] } : {})
    })
  );
  const { data: invitations } = useQuery(invitationsQueryOptions({ page: 1, page_size: 100 }));
  const update = useMutation(updateUserMutation(queryClient));
  const remove = useMutation(removeUserMutation(queryClient));
  const resend = useMutation(resendInvitationMutation(queryClient));
  const revoke = useMutation(revokeInvitationMutation(queryClient));

  const members = data?.items ?? [];
  const pending = (invitations?.items ?? []).filter(
    (i) => !search.trim() || i.email.includes(search.trim().toLowerCase())
  );
  const filtered = search.trim() || role !== ALL || status !== ALL;
  const limit = me.tenant.plan.limits?.users ?? null;

  const when = (iso: string | null | undefined) => {
    if (!iso) return t('never');
    const d = new Date(iso);
    return now.getTime() - d.getTime() < WEEK
      ? format.relativeTime(d, now)
      : format.dateTime(d, 'medium');
  };

  const toggleStatus = (m: Membership) =>
    update.mutate(
      { id: m.user.id, body: { status: m.status === 'disabled' ? 'active' : 'disabled' } },
      {
        onSuccess: () => toast.success(m.status === 'disabled' ? ta('enabled') : ta('disabled')),
        onError: (e) => toast.error(errorText(e))
      }
    );

  return (
    <div className='flex flex-col gap-4' data-testid='users-table'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-56 flex-1'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className='h-8 pl-8'
            aria-label={t('search')}
          />
        </div>
        <Select value={role} onValueChange={(v) => setRole(v ?? ALL)}>
          <SelectTrigger className='h-8 w-52' aria-label={t('role')}>
            <SelectValue>
              {(v: string) => (v === ALL ? t('anyRole') : tr(`${v as Role}.title`))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('anyRole')}</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {tr(`${r}.title`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
          <SelectTrigger className='h-8 w-44' aria-label={t('status')}>
            <SelectValue>
              {(v: string) =>
                v === ALL ? t('anyStatus') : t(`statuses.${v as Membership['status']}`)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('anyStatus')}</SelectItem>
            {(['active', 'invited', 'disabled'] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {t(`statuses.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size='sm'
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          data-testid='users-invite'
        >
          <Icons.userPlus className='size-4' /> {ta('invite')}
        </Button>
      </div>
      {limit != null && (
        <p className='text-muted-foreground text-xs'>
          {t('limit', { used: data?.meta.total ?? members.length, limit })}
        </p>
      )}

      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{t('scope')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('lastLogin')}</TableHead>
              <TableHead className='w-0' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 4 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && members.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Empty className='py-8'>
                    <EmptyHeader>
                      <EmptyMedia variant='icon'>
                        <Icons.teams />
                      </EmptyMedia>
                      <EmptyTitle>{filtered ? t('emptyFiltered') : t('empty')}</EmptyTitle>
                      {!filtered && <EmptyDescription>{t('emptyHint')}</EmptyDescription>}
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {members.map((m) => {
              const self = m.user.id === me.user.id;
              const canEdit = !self && (m.role !== 'owner' || me.role === 'owner');
              return (
                <TableRow key={m.user.id} data-user={m.user.email} data-status={m.status}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar className='size-8'>
                        {m.user.avatar_url && <AvatarImage src={m.user.avatar_url} alt='' />}
                        <AvatarFallback className='text-xs'>{initials(m.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2 font-medium'>
                          <span className='truncate'>{m.user.name}</span>
                          {self && (
                            <Badge variant='secondary' className='text-[10px]'>
                              {t('you')}
                            </Badge>
                          )}
                          {m.user.two_factor_enabled && (
                            <Icons.shieldCheck
                              className='text-status-synced size-3.5'
                              aria-label={t('twoFactor')}
                            />
                          )}
                        </div>
                        <div className='text-muted-foreground truncate text-xs'>{m.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{tr(`${m.role}.title`)}</TableCell>
                  <TableCell>
                    <ScopeBadge rule={m.access_rule} />
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className={cn('gap-1', STATUS_TONE[m.status])}>
                      <span className='size-1.5 rounded-full bg-current' aria-hidden />
                      {t(`statuses.${m.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-xs'>
                    {m.last_login_at ? (
                      <time dateTime={m.last_login_at}>{when(m.last_login_at)}</time>
                    ) : (
                      t('never')
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8'
                            aria-label={`${tc('openMenu')}: ${m.user.name}`}
                            disabled={!canEdit}
                          />
                        }
                      >
                        <Icons.ellipsis className='size-4' />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{tc('actions')}</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(m);
                              setSheetOpen(true);
                            }}
                          >
                            <Icons.userPen className='size-4' /> {ta('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(m)}>
                            {m.status === 'disabled' ? (
                              <>
                                <Icons.circleCheck className='size-4' /> {ta('enable')}
                              </>
                            ) : (
                              <>
                                <Icons.userOff className='size-4' /> {ta('disable')}
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem variant='destructive' onClick={() => setRemoving(m)}>
                            <Icons.trash className='size-4' /> {ta('remove')}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pending.length > 0 && (
        <section className='flex flex-col gap-2' data-testid='invitations'>
          <h3 className='text-sm font-semibold'>{t('invitations', { count: pending.length })}</h3>
          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead>{t('scope')}</TableHead>
                  <TableHead>{t('expires')}</TableHead>
                  <TableHead className='w-0' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((i) => (
                  <TableRow key={i.id} data-invitation={i.email}>
                    <TableCell className='font-medium'>{i.email}</TableCell>
                    <TableCell>{tr(`${i.role}.title`)}</TableCell>
                    <TableCell>
                      <ScopeBadge rule={i.access_rule} />
                    </TableCell>
                    <TableCell className='text-muted-foreground text-xs'>
                      <time dateTime={i.expires_at}>
                        {format.dateTime(new Date(i.expires_at), 'medium')}
                      </time>
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          size='sm'
                          variant='ghost'
                          disabled={resend.isPending}
                          onClick={() =>
                            resend.mutate(
                              { id: i.id },
                              {
                                onSuccess: () => toast.success(ta('resent', { email: i.email })),
                                onError: (e) => toast.error(errorText(e))
                              }
                            )
                          }
                        >
                          <Icons.mailForward className='size-4' /> {ta('resend')}
                        </Button>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={`${ta('revoke')}: ${i.email}`}
                          onClick={() => setRevoking(i)}
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
        </section>
      )}

      <UserSheet open={sheetOpen} onOpenChange={setSheetOpen} member={editing} />
      <AlertModal
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        loading={remove.isPending}
        title={ta('remove')}
        description={removing ? ta('removeConfirm', { name: removing.user.name }) : ''}
        confirmLabel={tc('delete')}
        onConfirm={() =>
          removing &&
          remove.mutate(
            { id: removing.user.id },
            {
              onSuccess: () => {
                toast.success(ta('removed'));
                setRemoving(null);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
      <AlertModal
        isOpen={!!revoking}
        onClose={() => setRevoking(null)}
        loading={revoke.isPending}
        title={ta('revoke')}
        description={revoking ? ta('revokeConfirm', { email: revoking.email }) : ''}
        confirmLabel={tc('delete')}
        onConfirm={() =>
          revoking &&
          revoke.mutate(
            { id: revoking.id },
            {
              onSuccess: () => {
                toast.success(ta('revoked'));
                setRevoking(null);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
    </div>
  );
}
