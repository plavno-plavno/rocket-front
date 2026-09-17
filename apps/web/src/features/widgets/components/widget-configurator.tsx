'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useCan } from '@/features/session';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  createWidgetMutation,
  deleteWidgetMutation,
  rotateWidgetKeyMutation,
  updateWidgetMutation
} from '../api/mutations';
import { widgetsQueryOptions } from '../api/queries';
import type { Widget, WidgetUpsert } from '../api/types';

const THEMES = ['light', 'dark', 'auto'] as const;
type Theme = (typeof THEMES)[number];

export interface WidgetConfig {
  theme?: Theme;
  min_rating?: number;
  platforms?: string[];
  limit?: number;
  default_city?: string;
  show_hours?: boolean;
}

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function DomainsInput({
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
      .split(/[\s,;]+/)
      .map((s) =>
        s
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/\/.*$/, '')
      )
      .filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setDraft('');
  };
  return (
    <div
      className='border-input flex flex-wrap items-center gap-1 rounded-md border p-1.5'
      data-testid='widget-domains'
    >
      {value.map((d) => (
        <span
          key={d}
          className='bg-muted inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs'
        >
          {d}
          <button
            type='button'
            aria-label={d}
            onClick={() => onChange(value.filter((x) => x !== d))}
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
          if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
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

/**
 * S-WID-01 configurator shared by «Виджет с отзывами» and «Сторлокатор»: widget list of one kind,
 * settings form, allowed domains, embed snippet with copy, key rotation, preview slot.
 */
export function WidgetConfigurator({
  kind,
  renderPreview
}: {
  kind: Widget['kind'];
  renderPreview: (config: WidgetConfig) => React.ReactNode;
}) {
  const t = useTranslations('widgets.configurator');
  const canEdit = useCan('integrations.manage');
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(widgetsQueryOptions({ 'filter[kind]': kind }));
  const { data: platforms } = useQuery(platformsQueryOptions());
  const create = useMutation(createWidgetMutation(queryClient));
  const update = useMutation(updateWidgetMutation(queryClient));
  const remove = useMutation(deleteWidgetMutation(queryClient));
  const rotate = useMutation(rotateWidgetKeyMutation(queryClient));
  const widgets = data?.items ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const selected = creating
    ? null
    : (widgets.find((w) => w.id === selectedId) ?? widgets[0] ?? null);

  const [name, setName] = useState('');
  const [config, setConfig] = useState<WidgetConfig>({});
  const [domains, setDomains] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(selected?.name ?? '');
    setConfig(
      (selected?.config as WidgetConfig | undefined) ?? {
        theme: 'light',
        min_rating: 4,
        limit: 12,
        platforms: []
      }
    );
    setDomains(selected?.allowed_domains ?? []);
    setError(null);
  }, [selected]);

  const pending = create.isPending || update.isPending;
  const dirty =
    !!selected &&
    (name !== selected.name ||
      JSON.stringify(config) !== JSON.stringify(selected.config) ||
      JSON.stringify(domains) !== JSON.stringify(selected.allowed_domains));
  const save = async () => {
    if (!name.trim()) return setError(t('nameRequired'));
    const body: WidgetUpsert = {
      kind,
      name: name.trim(),
      config: config as Record<string, unknown>,
      allowed_domains: domains
    };
    try {
      if (selected) {
        await update.mutateAsync({ id: selected.id, body });
        toast.success(t('saved'));
      } else {
        const w = await create.mutateAsync({ body });
        toast.success(t('created'));
        setCreating(false);
        setSelectedId(w.id);
      }
    } catch (e) {
      setError(errorText(e));
    }
  };
  const copy = (text: string) =>
    navigator.clipboard.writeText(text).then(() => toast.success(t('copied')));

  if (isPending) return <Skeleton className='h-96' />;

  return (
    <div
      className='grid gap-4 lg:grid-cols-[1fr_22rem]'
      data-testid={`widget-configurator-${kind}`}
    >
      <div className='flex flex-col gap-4'>
        <div className='flex flex-wrap items-center gap-2'>
          {widgets.length > 0 && (
            <Select
              value={selected?.id ?? '__new__'}
              onValueChange={(v) => {
                setCreating(false);
                setSelectedId(v ?? null);
              }}
            >
              <SelectTrigger
                className='h-8 min-w-56'
                aria-label={t('select')}
                data-testid='widget-select'
              >
                <SelectValue>
                  {(v: string) => widgets.find((w) => w.id === v)?.name ?? t('newWidget')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {widgets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canEdit && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                setCreating(true);
                setSelectedId(null);
              }}
              data-testid='widget-create'
            >
              <Icons.add className='size-4' /> {t('create')}
            </Button>
          )}
        </div>

        {!selected && !creating ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icons.widget />
              </EmptyMedia>
              <EmptyTitle>{t('empty')}</EmptyTitle>
              <EmptyDescription>{t('emptyHint')}</EmptyDescription>
            </EmptyHeader>
            {canEdit && <Button onClick={() => setCreating(true)}>{t('create')}</Button>}
          </Empty>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{selected ? t('settings') : t('newWidget')}</CardTitle>
              <CardDescription>{t(`kinds.${kind}`)}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              <Field>
                <FieldLabel htmlFor='widget-name'>{t('name')}</FieldLabel>
                <Input
                  id='widget-name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                />
              </Field>
              <div className='grid gap-4 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='widget-theme'>{t('theme')}</FieldLabel>
                  <Select
                    value={config.theme ?? 'light'}
                    onValueChange={(v) => setConfig({ ...config, theme: (v as Theme) ?? 'light' })}
                  >
                    <SelectTrigger id='widget-theme' aria-label={t('theme')} disabled={!canEdit}>
                      <SelectValue>{(v: string) => t(`themes.${v as Theme}`)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map((th) => (
                        <SelectItem key={th} value={th}>
                          {t(`themes.${th}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {kind === 'reviews' ? (
                  <>
                    <Field>
                      <FieldLabel htmlFor='widget-min-rating'>{t('minRating')}</FieldLabel>
                      <Select
                        value={String(config.min_rating ?? 1)}
                        onValueChange={(v) => setConfig({ ...config, min_rating: Number(v) || 1 })}
                      >
                        <SelectTrigger
                          id='widget-min-rating'
                          aria-label={t('minRating')}
                          disabled={!canEdit}
                        >
                          <SelectValue>
                            {(v: string) => t('stars', { count: Number(v) })}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((r) => (
                            <SelectItem key={r} value={String(r)}>
                              {t('stars', { count: r })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>{t('minRatingHint')}</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor='widget-limit'>{t('limit')}</FieldLabel>
                      <Input
                        id='widget-limit'
                        type='number'
                        min={3}
                        max={50}
                        value={config.limit ?? 12}
                        onChange={(e) =>
                          setConfig({ ...config, limit: Number(e.target.value) || 12 })
                        }
                        disabled={!canEdit}
                      />
                    </Field>
                    <Field className='sm:col-span-2'>
                      <FieldLabel>{t('platforms')}</FieldLabel>
                      <div className='grid gap-2 sm:grid-cols-2'>
                        {(platforms?.items ?? [])
                          .filter((p) => p.capabilities.reviews)
                          .map((p) => {
                            const list = config.platforms ?? [];
                            return (
                              <Label key={p.id} className='flex items-center gap-2 font-normal'>
                                <Checkbox
                                  checked={list.includes(p.id)}
                                  disabled={!canEdit}
                                  onCheckedChange={(v) =>
                                    setConfig({
                                      ...config,
                                      platforms: v
                                        ? [...list, p.id]
                                        : list.filter((x) => x !== p.id)
                                    })
                                  }
                                />
                                <PlatformIcon platformId={p.id} icon={p.icon} />
                                {p.name}
                              </Label>
                            );
                          })}
                      </div>
                      <FieldDescription>{t('platformsHint')}</FieldDescription>
                    </Field>
                  </>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor='widget-city'>{t('defaultCity')}</FieldLabel>
                      <Input
                        id='widget-city'
                        value={config.default_city ?? ''}
                        onChange={(e) => setConfig({ ...config, default_city: e.target.value })}
                        disabled={!canEdit}
                      />
                    </Field>
                    <Label className='flex items-center gap-2 font-normal sm:col-span-2'>
                      <Checkbox
                        checked={config.show_hours ?? true}
                        disabled={!canEdit}
                        onCheckedChange={(v) => setConfig({ ...config, show_hours: !!v })}
                      />
                      {t('showHours')}
                    </Label>
                  </>
                )}
              </div>
              <Field>
                <FieldLabel>{t('domains')}</FieldLabel>
                <DomainsInput
                  value={domains}
                  onChange={setDomains}
                  placeholder={t('domainsPlaceholder')}
                />
                <FieldDescription>{t('domainsHint')}</FieldDescription>
              </Field>
              {error && <FieldError>{error}</FieldError>}
            </CardContent>
            {canEdit && (
              <CardFooter className='justify-between gap-2'>
                <div className='flex gap-2'>
                  {selected && (
                    <Button variant='ghost' size='sm' onClick={() => setConfirmDelete(true)}>
                      <Icons.trash className='size-4' /> {t('delete')}
                    </Button>
                  )}
                </div>
                <div className='flex gap-2'>
                  {creating && (
                    <Button variant='outline' onClick={() => setCreating(false)}>
                      {t('cancel')}
                    </Button>
                  )}
                  <Button
                    onClick={save}
                    disabled={pending || (!!selected && !dirty)}
                    data-testid='widget-save'
                  >
                    {pending && <Icons.spinner className='size-4 animate-spin' />}
                    {selected ? t('save') : t('createSubmit')}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        )}

        {selected && (
          <Card data-testid='widget-snippet'>
            <CardHeader>
              <CardTitle>{t('snippet')}</CardTitle>
              <CardDescription>{t('snippetHint')}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-3'>
              <pre className='bg-muted overflow-x-auto rounded-md p-3 font-mono text-xs whitespace-pre-wrap'>
                {selected.embed_snippet}
              </pre>
              <div className='flex flex-wrap items-center gap-2 text-xs'>
                <span className='text-muted-foreground'>{t('publicKey')}</span>
                <Badge variant='outline' className='font-mono'>
                  {selected.public_key}
                </Badge>
                {canEdit && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-7'
                    onClick={() => setConfirmRotate(true)}
                    data-testid='widget-rotate'
                  >
                    <Icons.refresh className='size-3.5' /> {t('rotate')}
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter className='justify-end'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => copy(selected.embed_snippet ?? '')}
                data-testid='widget-copy'
              >
                <Icons.copy className='size-4' /> {t('copy')}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <Card
        className={cn('h-fit', (config.theme ?? 'light') === 'dark' && 'dark')}
        data-testid='widget-preview'
      >
        <CardHeader>
          <CardTitle>{t('preview')}</CardTitle>
          <CardDescription>{t('previewHint')}</CardDescription>
        </CardHeader>
        <CardContent className='bg-background text-foreground rounded-b-xl'>
          {renderPreview(config)}
        </CardContent>
      </Card>

      <AlertModal
        isOpen={confirmRotate}
        onClose={() => setConfirmRotate(false)}
        loading={rotate.isPending}
        title={t('rotate')}
        description={t('rotateConfirm')}
        confirmLabel={t('rotate')}
        onConfirm={() =>
          selected &&
          rotate.mutate(
            { id: selected.id },
            {
              onSuccess: () => {
                toast.success(t('rotated'));
                setConfirmRotate(false);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
      <AlertModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        loading={remove.isPending}
        title={t('delete')}
        description={selected ? t('deleteConfirm', { name: selected.name }) : ''}
        confirmLabel={t('delete')}
        onConfirm={() =>
          selected &&
          remove.mutate(
            { id: selected.id },
            {
              onSuccess: () => {
                toast.success(t('deleted'));
                setConfirmDelete(false);
                setSelectedId(null);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
    </div>
  );
}
