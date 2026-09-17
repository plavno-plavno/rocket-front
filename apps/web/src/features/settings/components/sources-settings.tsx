'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  platformsQueryOptions,
  sourceSettingsQueryOptions,
  updateSourceSettingsMutation,
  type SourceSettings
} from '@/features/sources';
import { isApiError } from '@/lib/api';

type Policy = SourceSettings['field_policies'][number]['policy'];

const POLICIES: Policy[] = ['enforce', 'accept_platform', 'ask'];
/** Fields that can carry a policy (SDD-00 §3.4); the rest inherit `enforce`. */
const FIELDS = [
  'name',
  'address',
  'phones',
  'hours',
  'website',
  'description',
  'categories',
  'media'
] as const;

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

/** S-SET-06 «Настройка источников»: per-field conflict policies and per-platform toggles. */
export function SourcesSettings() {
  const t = useTranslations('settings.sources');
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(sourceSettingsQueryOptions());
  const { data: platforms } = useQuery(platformsQueryOptions());
  const save = useMutation(updateSourceSettingsMutation(queryClient));
  const [draft, setDraft] = useState<SourceSettings | null>(null);

  useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  if (isPending || !draft) {
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-72' />
        <Skeleton className='h-48' />
      </div>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(data);
  const policyOf = (field: string): Policy =>
    draft.field_policies.find((p) => p.field === field)?.policy ?? 'enforce';
  const setPolicy = (field: string, policy: Policy) =>
    setDraft({
      ...draft,
      field_policies: draft.field_policies.some((p) => p.field === field)
        ? draft.field_policies.map((p) => (p.field === field ? { ...p, policy } : p))
        : [...draft.field_policies, { field, policy }]
    });
  const platformRow = (id: string) =>
    draft.platforms.find((p) => p.platform_id === id) ?? { platform_id: id, enabled: false };
  const setPlatform = (id: string, patch: Partial<SourceSettings['platforms'][number]>) =>
    setDraft({
      ...draft,
      platforms: draft.platforms.some((p) => p.platform_id === id)
        ? draft.platforms.map((p) => (p.platform_id === id ? { ...p, ...patch } : p))
        : [...draft.platforms, { platform_id: id, enabled: false, ...patch }]
    });

  const submit = () =>
    save.mutate(draft, {
      onSuccess: () => toast.success(t('saved')),
      onError: (e) => toast.error(errorText(e))
    });

  return (
    <div className='flex flex-col gap-6' data-testid='sources-settings'>
      <Card>
        <CardHeader>
          <CardTitle>{t('policies.title')}</CardTitle>
          <CardDescription>{t('policies.description')}</CardDescription>
        </CardHeader>
        <CardContent className='px-0'>
          <Table data-testid='policies-table'>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-6'>{t('policies.field')}</TableHead>
                <TableHead className='w-64 pr-6'>{t('policies.policy')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FIELDS.map((field) => (
                <TableRow key={field} data-field={field}>
                  <TableCell className='pl-6'>
                    <div className='font-medium'>{t(`fields.${field}`)}</div>
                  </TableCell>
                  <TableCell className='pr-6'>
                    <Select
                      value={policyOf(field)}
                      onValueChange={(v) => setPolicy(field, (v as Policy) ?? 'enforce')}
                    >
                      <SelectTrigger
                        className='h-8'
                        aria-label={`${t('policies.policy')}: ${t(`fields.${field}`)}`}
                      >
                        <SelectValue>{(v: string) => t(`policy.${v as Policy}.title`)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {POLICIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            <span className='flex flex-col'>
                              <span>{t(`policy.${p}.title`)}</span>
                              <span className='text-muted-foreground text-xs'>
                                {t(`policy.${p}.hint`)}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('platforms.title')}</CardTitle>
          <CardDescription>{t('platforms.description')}</CardDescription>
        </CardHeader>
        <CardContent className='px-0'>
          <Table data-testid='platforms-table'>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-6'>{t('platforms.platform')}</TableHead>
                <TableHead className='w-32 text-center'>{t('platforms.enabled')}</TableHead>
                <TableHead className='w-40 pr-6 text-center'>{t('platforms.autoReply')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(platforms?.items ?? []).map((p) => {
                const row = platformRow(p.id);
                const canReply = p.capabilities.reviews?.reply ?? false;
                return (
                  <TableRow key={p.id} data-platform={p.id}>
                    <TableCell className='pl-6'>
                      <span className='flex items-center gap-2'>
                        <PlatformIcon platformId={p.id} icon={p.icon} />
                        <span className='font-medium'>{p.name}</span>
                        {p.health !== 'ok' && (
                          <span className='text-status-action inline-flex items-center gap-1 text-xs'>
                            <Icons.warning className='size-3.5' /> {t(`health.${p.health}`)}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className='text-center'>
                      <Switch
                        checked={row.enabled}
                        onCheckedChange={(v) => setPlatform(p.id, { enabled: v })}
                        aria-label={`${t('platforms.enabled')}: ${p.name}`}
                      />
                    </TableCell>
                    <TableCell className='pr-6 text-center'>
                      <Switch
                        checked={row.auto_reply_enabled ?? false}
                        disabled={!row.enabled || !canReply}
                        onCheckedChange={(v) => setPlatform(p.id, { auto_reply_enabled: v })}
                        aria-label={`${t('platforms.autoReply')}: ${p.name}`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className='justify-end gap-2'>
          <Button
            variant='outline'
            disabled={!dirty || save.isPending}
            onClick={() => data && setDraft(structuredClone(data))}
          >
            {t('reset')}
          </Button>
          <Button
            onClick={submit}
            disabled={!dirty || save.isPending}
            data-testid='sources-settings-save'
          >
            {save.isPending && <Icons.spinner className='size-4 animate-spin' />}
            {t('save')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
