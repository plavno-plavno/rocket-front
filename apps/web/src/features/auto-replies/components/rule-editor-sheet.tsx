'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { aiReplyProfilesQueryOptions } from '@/features/ai-replies';
import { LocationPicker } from '@/features/locations';
import { platformsQueryOptions } from '@/features/sources';
import { replyTemplatesQueryOptions } from '@/features/templates';
import { isApiError } from '@/lib/api';
import { createAutoReplyRuleMutation, updateAutoReplyRuleMutation } from '../api/mutations';
import type { AutoReplyRule } from '../api/types';

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
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };
  return (
    <div className='flex flex-wrap items-center gap-1 rounded-md border p-1.5'>
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
        placeholder={placeholder}
        aria-label={placeholder}
        className='min-w-32 flex-1 bg-transparent px-1 text-sm outline-none'
      />
    </div>
  );
}

const toggleId = (list: string[], id: string, set: (v: string[]) => void) =>
  set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** Sheet form of an auto-reply rule (S-REV-04): conditions → action, mode, delay, working hours. */
export function RuleEditorSheet({
  open,
  onOpenChange,
  rule
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: AutoReplyRule | null;
}) {
  const t = useTranslations('auto-replies.editor');
  const ta = useTranslations('auto-replies.actions');
  const tm = useTranslations('auto-replies.mode');
  const queryClient = useQueryClient();
  const { data: platforms } = useQuery({ ...platformsQueryOptions(), enabled: open });
  const { data: templates } = useQuery({
    ...replyTemplatesQueryOptions({ page: 1, page_size: 200 }),
    enabled: open
  });
  const { data: profiles } = useQuery({ ...aiReplyProfilesQueryOptions(), enabled: open });

  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [ratings, setRatings] = useState<number[]>([]);
  const [hasText, setHasText] = useState<'any' | 'yes' | 'no'>('any');
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [actionKind, setActionKind] = useState<'templates' | 'ai'>('templates');
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [mode, setMode] = useState<AutoReplyRule['mode']>('draft');
  const [delay, setDelay] = useState(0);
  const [workingHours, setWorkingHours] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; action?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(rule?.name ?? '');
    setEnabled(rule?.enabled ?? true);
    setRatings(rule?.conditions.ratings ?? []);
    setHasText(rule?.conditions.has_text == null ? 'any' : rule.conditions.has_text ? 'yes' : 'no');
    setPlatformIds(rule?.conditions.platform_ids ?? []);
    const scope = rule?.conditions.scope ?? null;
    setGroupIds(scope && scope !== 'all' && scope.startsWith('grp_') ? scope.split(',') : []);
    setLocationIds(scope && scope.startsWith('loc_') ? scope.split(',') : []);
    setKeywords(rule?.conditions.keywords ?? []);
    setActionKind(rule?.action.ai_profile_id ? 'ai' : 'templates');
    setTemplateIds(rule?.action.template_ids ?? []);
    setProfileId(rule?.action.ai_profile_id ?? null);
    setMode(rule?.mode ?? 'draft');
    setDelay(rule?.delay_minutes ?? 0);
    setWorkingHours(rule?.working_hours_only ?? true);
    setErrors({});
    setApiError(null);
  }, [open, rule]);

  const create = useMutation(createAutoReplyRuleMutation(queryClient));
  const update = useMutation(updateAutoReplyRuleMutation(queryClient));
  const pending = create.isPending || update.isPending;

  const submit = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = t('nameRequired');
    if (actionKind === 'templates' ? templateIds.length === 0 : !profileId)
      next.action = t('actionRequired');
    setErrors(next);
    if (Object.keys(next).length) return;
    const scopeIds = [...groupIds, ...locationIds];
    const body = {
      name: name.trim(),
      enabled,
      conditions: {
        ratings,
        has_text: hasText === 'any' ? null : hasText === 'yes',
        platform_ids: platformIds,
        scope: scopeIds.length ? scopeIds.join(',') : null,
        keywords
      },
      action:
        actionKind === 'templates'
          ? { template_ids: templateIds, ai_profile_id: null }
          : { template_ids: [], ai_profile_id: profileId },
      mode,
      delay_minutes: delay,
      working_hours_only: workingHours
    };
    try {
      if (rule) await update.mutateAsync({ id: rule.id, body });
      else await create.mutateAsync({ body });
      toast.success(rule ? ta('updated') : ta('created'));
      onOpenChange(false);
    } catch (e) {
      setApiError(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='flex w-full flex-col gap-0 p-0 sm:max-w-xl'
        data-testid='rule-editor'
      >
        <SheetHeader className='border-b'>
          <SheetTitle>{rule ? t('editTitle') : t('createTitle')}</SheetTitle>
          <SheetDescription className='sr-only'>{t('conditions')}</SheetDescription>
        </SheetHeader>
        <div className='flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4'>
          {apiError && (
            <Alert variant='destructive'>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <div className='flex items-end gap-3'>
            <Field className='flex-1'>
              <FieldLabel htmlFor='rule-name'>{t('name')}</FieldLabel>
              <Input
                id='rule-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                aria-invalid={!!errors.name}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>
            <Label className='flex items-center gap-2 pb-2 text-sm'>
              <Switch checked={enabled} onCheckedChange={setEnabled} /> {t('enabled')}
            </Label>
          </div>

          <fieldset className='flex flex-col gap-3 rounded-lg border p-3'>
            <legend className='px-1 text-sm font-medium'>{t('conditions')}</legend>
            <Field>
              <FieldLabel>{t('ratings')}</FieldLabel>
              <ToggleGroup
                multiple
                value={ratings.map(String)}
                onValueChange={(v) =>
                  setRatings(((Array.isArray(v) ? v : [v]) as string[]).map(Number))
                }
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <ToggleGroupItem key={r} value={String(r)} size='sm' aria-label={`${r}`}>
                    {r} ★
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel>{t('hasText')}</FieldLabel>
              <ToggleGroup
                value={[hasText]}
                onValueChange={(v) => {
                  const n = (Array.isArray(v) ? v[0] : v) as typeof hasText | undefined;
                  if (n) setHasText(n);
                }}
              >
                <ToggleGroupItem value='any' size='sm'>
                  {t('hasTextAny')}
                </ToggleGroupItem>
                <ToggleGroupItem value='yes' size='sm'>
                  {t('hasTextYes')}
                </ToggleGroupItem>
                <ToggleGroupItem value='no' size='sm'>
                  {t('hasTextNo')}
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel>{t('platforms')}</FieldLabel>
              <FieldDescription>{t('platformsHint')}</FieldDescription>
              <div className='grid grid-cols-2 gap-1.5 sm:grid-cols-3'>
                {(platforms?.items ?? []).map((p) => (
                  <Label key={p.id} className='flex items-center gap-2 text-sm font-normal'>
                    <Checkbox
                      checked={platformIds.includes(p.id)}
                      onCheckedChange={() => toggleId(platformIds, p.id, setPlatformIds)}
                    />{' '}
                    {p.name}
                  </Label>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel>{t('scope')}</FieldLabel>
              <LocationPicker
                value={{ location_ids: locationIds, group_ids: groupIds }}
                onChange={(v) => {
                  setLocationIds(v.location_ids);
                  setGroupIds(v.group_ids);
                }}
              />
            </Field>
            <Field>
              <FieldLabel>{t('keywords')}</FieldLabel>
              <KeywordsInput
                value={keywords}
                onChange={setKeywords}
                placeholder={t('keywordsPlaceholder')}
              />
            </Field>
          </fieldset>

          <fieldset className='flex flex-col gap-3 rounded-lg border p-3'>
            <legend className='px-1 text-sm font-medium'>{t('action')}</legend>
            <ToggleGroup
              value={[actionKind]}
              onValueChange={(v) => {
                const n = (Array.isArray(v) ? v[0] : v) as typeof actionKind | undefined;
                if (n) setActionKind(n);
              }}
            >
              <ToggleGroupItem value='templates' size='sm'>
                {t('actionTemplates')}
              </ToggleGroupItem>
              <ToggleGroupItem value='ai' size='sm'>
                {t('actionAi')}
              </ToggleGroupItem>
            </ToggleGroup>
            {actionKind === 'templates' ? (
              <Field>
                <FieldLabel>{t('templates')}</FieldLabel>
                <FieldDescription>{t('templatesHint')}</FieldDescription>
                <div className='flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-md border p-2'>
                  {(templates?.items ?? []).map((tpl) => (
                    <Label key={tpl.id} className='flex items-center gap-2 text-sm font-normal'>
                      <Checkbox
                        checked={templateIds.includes(tpl.id)}
                        onCheckedChange={() => toggleId(templateIds, tpl.id, setTemplateIds)}
                      />
                      <span className='truncate'>{tpl.name}</span>
                    </Label>
                  ))}
                </div>
              </Field>
            ) : (
              <Field>
                <FieldLabel>{t('aiProfile')}</FieldLabel>
                <Select value={profileId} onValueChange={setProfileId}>
                  <SelectTrigger aria-label={t('aiProfile')}>
                    <SelectValue placeholder={t('aiProfile')}>
                      {(v: string | null) =>
                        profiles?.items.find((p) => p.id === v)?.name ?? t('aiProfile')
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(profiles?.items ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            {errors.action && <FieldError>{errors.action}</FieldError>}
          </fieldset>

          <div className='grid gap-3 sm:grid-cols-2'>
            <Field>
              <FieldLabel>{t('mode')}</FieldLabel>
              <Select value={mode} onValueChange={(v) => v && setMode(v as AutoReplyRule['mode'])}>
                <SelectTrigger aria-label={t('mode')}>
                  <SelectValue>{(v: AutoReplyRule['mode']) => tm(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='draft'>{tm('draft')}</SelectItem>
                  <SelectItem value='publish'>{tm('publish')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor='rule-delay'>{t('delay')}</FieldLabel>
              <Input
                id='rule-delay'
                type='number'
                min={0}
                max={1440}
                value={delay}
                onChange={(e) => setDelay(Math.max(0, Number(e.target.value) || 0))}
              />
            </Field>
          </div>
          <Label className='flex items-center gap-2 text-sm'>
            <Switch checked={workingHours} onCheckedChange={setWorkingHours} />{' '}
            {t('workingHoursOnly')}
          </Label>
        </div>
        <SheetFooter>
          <Button onClick={submit} disabled={pending} data-testid='rule-save'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {t('save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
