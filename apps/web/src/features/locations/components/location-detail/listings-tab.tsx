'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon, SyncStatusBadge } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LinkButton } from '@/components/ui/link-button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { platformsQueryOptions } from '@/features/sources';
import { useCan } from '@/features/session';
import { listingActionMutation } from '../../api/mutations';
import { locationListingsQueryOptions } from '../../api/queries';
import type { Listing, ListingAction } from '../../api/types';

const ACTIONS_BY_REASON: Record<string, ListingAction[]> = {
  moderation_rejected: ['retry'],
  verification_required: ['retry'],
  drift_needs_decision: ['resolve_drift_enforce', 'resolve_drift_accept_platform'],
  manual_task_pending: ['mark_manual_done'],
  duplicate_detected: ['retry', 'disconnect'],
  listing_suspended: ['retry', 'disconnect'],
  conflicting_owner: ['disconnect']
};

/** S-LOC-03 «Площадки»: listings of the location with status, reason + CTA, match state, last check. */
export function ListingsTab({ locationId }: { locationId: string }) {
  const t = useTranslations('locations.detail.listings');
  const ts = useTranslations('status');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const canEdit = useCan('locations.edit');
  const { data, isPending } = useQuery(locationListingsQueryOptions(locationId));
  const { data: platforms } = useQuery(platformsQueryOptions());
  const act = useMutation({
    ...listingActionMutation(queryClient, locationId),
    onSuccess: () => toast.success(t('done')),
    onError: (e) => toast.error(e.message)
  });
  const platform = (id: string) => platforms?.items.find((p) => p.id === id);

  if (isPending)
    return (
      <div className='flex flex-col gap-2'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-10' />
        ))}
      </div>
    );
  const items = (data?.items ?? []).toSorted((a, b) =>
    a.sync_status === 'action_required' ? -1 : b.sync_status === 'action_required' ? 1 : 0
  );
  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader className='bg-muted'>
          <TableRow>
            <TableHead>{t('columns.platform')}</TableHead>
            <TableHead>{t('columns.status')}</TableHead>
            <TableHead>{t('columns.action')}</TableHead>
            <TableHead>{t('columns.match')}</TableHead>
            <TableHead>{t('columns.checked')}</TableHead>
            <TableHead className='w-24' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((l) => (
            <TableRow key={l.id}>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <PlatformIcon
                    platformId={l.platform_id}
                    icon={platform(l.platform_id)?.icon}
                    className='size-5'
                  />
                  <div className='flex flex-col'>
                    <span className='font-medium'>
                      {platform(l.platform_id)?.name ?? l.platform_id}
                    </span>
                    {l.url ? (
                      <a
                        href={l.url}
                        target='_blank'
                        rel='noreferrer'
                        className='text-muted-foreground hover:text-foreground truncate text-xs underline-offset-2 hover:underline'
                      >
                        {l.external_id}
                      </a>
                    ) : (
                      <span className='text-muted-foreground text-xs'>{t('notConnected')}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <SyncStatusBadge status={l.sync_status} compact />
              </TableCell>
              <TableCell className='max-w-64'>
                {l.action_reason ? (
                  <div className='flex flex-col gap-1 text-xs'>
                    <span>{l.action_hint ?? l.action_reason}</span>
                    {l.drift_fields?.length ? (
                      <span className='text-status-action'>
                        {t('drift', { fields: l.drift_fields.join(', ') })}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className='text-muted-foreground'>—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant='outline' className='text-xs'>
                  {t(`match.${l.match_state}`)}
                  {l.match_score != null && (
                    <span className='text-muted-foreground ml-1 tabular-nums'>
                      {Math.round(l.match_score * 100)}%
                    </span>
                  )}
                </Badge>
              </TableCell>
              <TableCell className='text-muted-foreground text-xs whitespace-nowrap'>
                {l.last_snapshot_at ? format.relativeTime(new Date(l.last_snapshot_at), now) : '—'}
              </TableCell>
              <TableCell>
                <div className='flex justify-end gap-1'>
                  {l.url && (
                    <LinkButton
                      variant='ghost'
                      size='sm'
                      href={l.url}
                      target='_blank'
                      rel='noreferrer'
                      aria-label={t('open')}
                    >
                      <Icons.externalLink className='size-4' />
                    </LinkButton>
                  )}
                  {canEdit && l.action_reason && (
                    <ListingActionMenu
                      listing={l}
                      actions={
                        l.action_reason === 'access_lost' ||
                        l.action_reason === 'challenge_required'
                          ? []
                          : (ACTIONS_BY_REASON[l.action_reason] ?? ['retry'])
                      }
                      onAct={(action) => act.mutate({ id: l.id, action })}
                      pending={act.isPending}
                      reconnect={
                        l.action_reason === 'access_lost' ||
                        l.action_reason === 'challenge_required'
                      }
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className='text-muted-foreground h-24 text-center'>
                {t('empty')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <span className='sr-only'>{ts('synced')}</span>
    </div>
  );
}

function ListingActionMenu({
  listing,
  actions,
  onAct,
  pending,
  reconnect
}: {
  listing: Listing;
  actions: ListingAction[];
  onAct: (a: ListingAction) => void;
  pending: boolean;
  reconnect: boolean;
}) {
  const t = useTranslations('locations.detail.listings.actions');
  const tc = useTranslations('common');
  if (reconnect)
    return (
      <LinkButton
        variant='outline'
        size='sm'
        href={`/dashboard/settings/accounts?platform=${listing.platform_id}`}
      >
        {t('reconnect')}
      </LinkButton>
    );
  if (actions.length === 1)
    return (
      <Button variant='outline' size='sm' onClick={() => onAct(actions[0])} disabled={pending}>
        {t(actions[0])}
      </Button>
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' size='sm' disabled={pending} />}>
        {tc('actions')} <Icons.chevronDown className='size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          {actions.map((a) => (
            <DropdownMenuItem key={a} onClick={() => onAct(a)}>
              {t(a)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
