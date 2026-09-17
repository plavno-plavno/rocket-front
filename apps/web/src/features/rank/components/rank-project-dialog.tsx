'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { LocationPicker } from '@/features/locations';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { createRankProjectMutation, updateRankProjectMutation } from '../api/mutations';
import type { RankProject, RankProjectUpsert } from '../api/types';

const GRID_SIZES = [3, 5, 7, 9] as const;
const SCHEDULES: RankProjectUpsert['schedule'][] = ['daily', 'weekly', 'monthly', 'manual'];

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function KeywordsInput({
  value,
  onChange,
  placeholder
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft
      .split(/[,\n;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setDraft('');
  };
  return (
    <div
      className='border-input flex flex-wrap items-center gap-1 rounded-md border p-1.5'
      data-testid='rank-keywords'
    >
      {value.map((k) => (
        <span
          key={k}
          className='bg-muted inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs'
        >
          {k}
          <button
            type='button'
            aria-label={k}
            onClick={() => onChange(value.filter((x) => x !== k))}
            className='text-muted-foreground hover:text-foreground'
          >
            <Icons.close className='size-3' />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
          if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? '' : placeholder}
        aria-label={placeholder}
        className='min-w-40 flex-1 bg-transparent px-1 text-sm outline-none'
      />
    </div>
  );
}

/** Create / edit a rank project: name, platforms with rank support, keywords, grid, schedule, scope. */
export function RankProjectDialog({
  open,
  onOpenChange,
  project,
  onCreated
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project: RankProject | null;
  onCreated?: (p: RankProject) => void;
}) {
  const t = useTranslations('rank.project');
  const queryClient = useQueryClient();
  const { data: platforms } = useQuery({ ...platformsQueryOptions(), enabled: open });
  const create = useMutation(createRankProjectMutation(queryClient));
  const update = useMutation(updateRankProjectMutation(queryClient));
  const [name, setName] = useState('');
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [size, setSize] = useState<(typeof GRID_SIZES)[number]>(5);
  const [radius, setRadius] = useState(3000);
  const [schedule, setSchedule] = useState<RankProjectUpsert['schedule']>('weekly');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? '');
    setPlatformIds(project?.platform_ids ?? []);
    setKeywords(project?.keywords ?? []);
    setSize((project?.grid.size as (typeof GRID_SIZES)[number]) ?? 5);
    setRadius(project?.grid.radius_m ?? 3000);
    setSchedule(project?.schedule ?? 'weekly');
    const scope = project?.scope ?? 'all';
    setGroupIds(scope !== 'all' && scope.startsWith('grp_') ? scope.split(',') : []);
    setLocationIds(project?.location_ids ?? []);
    setError(null);
  }, [open, project]);

  const rankPlatforms = (platforms?.items ?? []).filter((p) => p.capabilities.rank?.supported);
  const pending = create.isPending || update.isPending;
  const submit = async () => {
    if (!name.trim()) return setError(t('nameRequired'));
    if (platformIds.length === 0) return setError(t('platformsRequired'));
    if (keywords.length === 0) return setError(t('keywordsRequired'));
    const body: RankProjectUpsert = {
      name: name.trim(),
      platform_ids: platformIds,
      keywords,
      grid: { size, radius_m: radius },
      schedule,
      scope: groupIds.length ? groupIds.join(',') : 'all',
      location_ids: locationIds
    };
    try {
      if (project) {
        await update.mutateAsync({ id: project.id, body });
        toast.success(t('updated'));
      } else {
        const created = await create.mutateAsync({ body });
        toast.success(t('created'));
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl' data-testid='rank-project-dialog'>
        <DialogHeader>
          <DialogTitle>{project ? t('editTitle') : t('createTitle')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className='flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1'>
          <Field>
            <FieldLabel htmlFor='rank-name'>{t('name')}</FieldLabel>
            <Input
              id='rank-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              autoFocus
            />
          </Field>
          <Field>
            <FieldLabel>{t('platforms')}</FieldLabel>
            <div className='grid gap-2 sm:grid-cols-2'>
              {rankPlatforms.map((p) => (
                <Label key={p.id} className='flex items-center gap-2 font-normal'>
                  <Checkbox
                    checked={platformIds.includes(p.id)}
                    onCheckedChange={(v) =>
                      setPlatformIds(
                        v ? [...platformIds, p.id] : platformIds.filter((x) => x !== p.id)
                      )
                    }
                  />
                  <PlatformIcon platformId={p.id} icon={p.icon} />
                  {p.name}
                </Label>
              ))}
            </div>
            <FieldDescription>{t('platformsHint')}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>{t('keywords')}</FieldLabel>
            <KeywordsInput
              value={keywords}
              onChange={setKeywords}
              placeholder={t('keywordsPlaceholder')}
            />
            <FieldDescription>{t('keywordsHint')}</FieldDescription>
          </Field>
          <div className='grid gap-4 sm:grid-cols-3'>
            <Field>
              <FieldLabel htmlFor='rank-grid'>{t('grid')}</FieldLabel>
              <Select
                value={String(size)}
                onValueChange={(v) => setSize((Number(v) as (typeof GRID_SIZES)[number]) || 5)}
              >
                <SelectTrigger id='rank-grid' aria-label={t('grid')}>
                  <SelectValue>{(v: string) => `${v} × ${v}`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GRID_SIZES.map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      {g} × {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor='rank-radius'>{t('radius')}</FieldLabel>
              <Input
                id='rank-radius'
                type='number'
                min={500}
                max={20000}
                step={500}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value) || 0)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='rank-schedule'>{t('schedule')}</FieldLabel>
              <Select
                value={schedule}
                onValueChange={(v) => setSchedule((v as RankProjectUpsert['schedule']) ?? 'weekly')}
              >
                <SelectTrigger id='rank-schedule' aria-label={t('schedule')}>
                  <SelectValue>
                    {(v: string) => t(`schedules.${v as RankProjectUpsert['schedule']}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`schedules.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel>{t('scope')}</FieldLabel>
            <div className='flex flex-wrap items-center gap-3'>
              <span className='text-sm'>
                {groupIds.length + locationIds.length === 0
                  ? t('scopeAll')
                  : t('scopeSelected', { count: groupIds.length + locationIds.length })}
              </span>
              <LocationPicker
                value={{ location_ids: locationIds, group_ids: groupIds }}
                onChange={(v) => {
                  setLocationIds(v.location_ids);
                  setGroupIds(v.group_ids);
                }}
                allowGroups
              />
            </div>
          </Field>
          {error && <FieldError>{error}</FieldError>}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending} data-testid='rank-project-submit'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
