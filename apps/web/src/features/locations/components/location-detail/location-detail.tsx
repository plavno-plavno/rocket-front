'use client';

import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { DetailPage, SyncStatusBadge } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/features/session';
import { useBreadcrumbTitle } from '@/shell/breadcrumb-store';
import { deleteLocationMutation } from '../../api/mutations';
import { locationGroupsQueryOptions, locationQueryOptions } from '../../api/queries';
import { useQuery } from '@tanstack/react-query';
import { LocationForm } from '../location-form/location-form';
import { HistoryTab } from './history-tab';
import { ListingsTab } from './listings-tab';
import { ReviewsTab } from './reviews-tab';

const TABS = ['data', 'listings', 'history', 'reviews'] as const;
type Tab = (typeof TABS)[number];

/** S-LOC-03 — location card: Данные / Площадки / История / Отзывы + aside (SDD-01 §8). */
export function LocationDetail({ id }: { id: string }) {
  const t = useTranslations('locations.detail');
  const ts = useTranslations('locations.status');
  const tstatus = useTranslations('status');
  const format = useFormatter();
  const router = useRouter();
  const queryClient = useQueryClient();
  const canEdit = useCan('locations.edit');
  const { data: location } = useSuspenseQuery(locationQueryOptions(id));
  const { data: groups } = useQuery(locationGroupsQueryOptions());
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TABS).withDefault('data').withOptions({ shallow: true })
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const remove = useMutation({
    ...deleteLocationMutation(queryClient),
    onSuccess: () => {
      toast.success(t('aside.delete'));
      router.replace('/dashboard/locations');
    },
    onError: (e) => toast.error(e.message)
  });
  useBreadcrumbTitle(`/dashboard/locations/${location.id}`, location.name);
  const summary = location.listing_summary;
  const groupBadges = (location.group_ids ?? [])
    .map((g) => ({ id: g, name: groups?.items.find((x) => x.id === g)?.name }))
    .filter((g): g is { id: string; name: string } => !!g.name);

  return (
    <DetailPage
      title={location.name}
      description={
        location.address.free_form ??
        `${location.address.city}, ${location.address.street ?? ''} ${location.address.house ?? ''}`
      }
      actions={
        <div className='flex items-center gap-2'>
          <Badge variant='outline'>{ts(location.status)}</Badge>
          {canEdit && (
            <Button variant='outline' size='sm' onClick={() => setConfirmDelete(true)}>
              <Icons.trash className='size-4' /> {t('aside.delete')}
            </Button>
          )}
        </div>
      }
      tabs={
        <Tabs value={tab} onValueChange={(v) => void setTab(v as Tab)}>
          <TabsList>
            {TABS.map((x) => (
              <TabsTrigger key={x} value={x}>
                {t(`tabs.${x}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      }
      aside={
        <>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>{t('aside.status')}</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-2 text-sm'>
              {summary &&
                (
                  [
                    'synced',
                    'sent',
                    'action_required',
                    'not_connected',
                    'unsupported',
                    'error'
                  ] as const
                )
                  .filter((s) => summary[s] > 0)
                  .map((s) => (
                    <div key={s} className='flex items-center justify-between'>
                      <SyncStatusBadge status={s} compact />
                      <span className='tabular-nums'>{summary[s]}</span>
                    </div>
                  ))}
              {summary && summary.total === 0 && (
                <p className='text-muted-foreground text-xs'>{tstatus('not_connected')}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>{t('aside.meta')}</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-2 text-sm'>
              <Row label={t('aside.branchCode')} value={location.branch_code ?? '—'} mono />
              <Row label={t('aside.version')} value={String(location.version)} />
              <Row
                label={t('aside.updated')}
                value={format.dateTime(new Date(location.updated_at), 'long')}
              />
              <Row
                label={t('aside.created')}
                value={format.dateTime(new Date(location.created_at), 'medium')}
              />
              {groupBadges.length > 0 && (
                <div className='flex flex-col gap-1'>
                  <span className='text-muted-foreground text-xs'>{t('aside.groups')}</span>
                  <div className='flex flex-wrap gap-1'>
                    {groupBadges.map((g) => (
                      <Badge key={g.id} variant='secondary' className='text-[11px]'>
                        {g.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {location.geo && (
                <LinkButton
                  variant='outline'
                  size='sm'
                  href={`https://yandex.ru/maps/?pt=${location.geo.lng},${location.geo.lat}&z=16`}
                  target='_blank'
                  rel='noreferrer'
                >
                  <Icons.mapPin className='size-4' /> {t('aside.openOnMap')}
                </LinkButton>
              )}
            </CardContent>
          </Card>
        </>
      }
    >
      <AlertModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate(location.id)}
        loading={remove.isPending}
      />
      {tab === 'data' && (
        <LocationForm key={location.version} location={location} readOnly={!canEdit} />
      )}
      {tab === 'listings' && <ListingsTab locationId={location.id} />}
      {tab === 'history' && (
        <HistoryTab locationId={location.id} currentVersion={location.version} />
      )}
      {tab === 'reviews' && <ReviewsTab locationId={location.id} />}
    </DetailPage>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className='flex items-center justify-between gap-2'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span className={mono ? 'font-mono text-xs' : 'text-xs'}>{value}</span>
    </div>
  );
}
