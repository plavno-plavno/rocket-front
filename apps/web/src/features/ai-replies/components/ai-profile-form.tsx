'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/features/session';
import { isApiError } from '@/lib/api';
import {
  createAiReplyProfileMutation,
  deleteAiReplyProfileMutation,
  updateAiReplyProfileMutation
} from '../api/mutations';
import { aiReplyProfilesQueryOptions } from '../api/queries';
import type { AiReplyProfile } from '../api/types';

const TONES = ['formal', 'friendly', 'neutral', 'playful'] as const;
const LANGS = ['ru', 'en'] as const;
const NEW = '__new__';
const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function PhrasesInput({
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
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        aria-label={placeholder}
        className='min-w-40 flex-1 bg-transparent px-1 text-sm outline-none'
      />
    </div>
  );
}

/** S-REV-05 profile card: tone, brand facts, forbidden phrases, signature, languages, max length. */
export function AiProfileForm({
  profileId,
  onProfileChange
}: {
  profileId: string | null;
  onProfileChange: (id: string | null) => void;
}) {
  const t = useTranslations('ai-replies.profile');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const canEdit = useCan('templates.team');
  const { data } = useQuery(aiReplyProfilesQueryOptions());
  const profiles = useMemo(() => data?.items ?? [], [data]);
  const current = profiles.find((p) => p.id === profileId) ?? null;
  const isNew = profileId === NEW;

  const [name, setName] = useState('');
  const [tone, setTone] = useState<AiReplyProfile['tone']>('friendly');
  const [facts, setFacts] = useState('');
  const [forbidden, setForbidden] = useState<string[]>([]);
  const [signature, setSignature] = useState('');
  const [languages, setLanguages] = useState<string[]>(['ru']);
  const [maxLength, setMaxLength] = useState(600);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!profileId && profiles[0]) onProfileChange(profiles[0].id);
  }, [profileId, profiles, onProfileChange]);
  useEffect(() => {
    setName(current?.name ?? '');
    setTone(current?.tone ?? 'friendly');
    setFacts(current?.brand_facts ?? '');
    setForbidden(current?.forbidden_phrases ?? []);
    setSignature(current?.signature ?? '');
    setLanguages(current?.languages ?? ['ru']);
    setMaxLength(current?.max_length ?? 600);
    setError(null);
  }, [current]);

  const create = useMutation(createAiReplyProfileMutation(queryClient));
  const update = useMutation(updateAiReplyProfileMutation(queryClient));
  const remove = useMutation(deleteAiReplyProfileMutation(queryClient));
  const pending = create.isPending || update.isPending;

  const save = async () => {
    if (!name.trim()) return setError(t('nameRequired'));
    const body = {
      name: name.trim(),
      tone,
      brand_facts: facts,
      forbidden_phrases: forbidden,
      signature,
      languages: languages as AiReplyProfile['languages'],
      max_length: maxLength
    };
    try {
      if (current) {
        await update.mutateAsync({ id: current.id, body });
        toast.success(t('saved'));
      } else {
        const created = await create.mutateAsync({ body });
        toast.success(t('created'));
        onProfileChange(created.id);
      }
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Card data-testid='ai-profile'>
      <CardHeader>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex-1'>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{current?.name ?? t('new')}</CardDescription>
          </div>
          <Select
            value={profileId ?? NEW}
            onValueChange={(v) => onProfileChange(v === NEW ? NEW : v)}
          >
            <SelectTrigger size='sm' className='w-52' aria-label={t('select')}>
              <SelectValue>
                {(v: string) =>
                  v === NEW ? t('new') : (profiles.find((p) => p.id === v)?.name ?? '')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
              {canEdit && <SelectItem value={NEW}>{t('new')}</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <Field>
          <FieldLabel htmlFor='ai-name'>{t('name')}</FieldLabel>
          <Input
            id='ai-name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            maxLength={80}
          />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel>{t('tone')}</FieldLabel>
            <Select
              value={tone}
              onValueChange={(v) => v && setTone(v as AiReplyProfile['tone'])}
              disabled={!canEdit}
            >
              <SelectTrigger aria-label={t('tone')}>
                <SelectValue>{(v: AiReplyProfile['tone']) => t(`tones.${v}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TONES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {t(`tones.${x}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor='ai-max'>{t('maxLength')}</FieldLabel>
            <Input
              id='ai-max'
              type='number'
              min={100}
              max={4000}
              step={50}
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value) || 600)}
              disabled={!canEdit}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor='ai-facts'>{t('brandFacts')}</FieldLabel>
          <FieldDescription>{t('brandFactsHint')}</FieldDescription>
          <Textarea
            id='ai-facts'
            rows={4}
            value={facts}
            onChange={(e) => setFacts(e.target.value)}
            disabled={!canEdit}
            maxLength={4000}
          />
        </Field>
        <Field>
          <FieldLabel>{t('forbidden')}</FieldLabel>
          <PhrasesInput
            value={forbidden}
            onChange={setForbidden}
            placeholder={t('forbiddenPlaceholder')}
          />
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='ai-signature'>{t('signature')}</FieldLabel>
            <Input
              id='ai-signature'
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              disabled={!canEdit}
              maxLength={120}
            />
          </Field>
          <Field>
            <FieldLabel>{t('languages')}</FieldLabel>
            <div className='flex gap-4 pt-2'>
              {LANGS.map((l) => (
                <Label key={l} className='flex items-center gap-2 text-sm font-normal uppercase'>
                  <Checkbox
                    checked={languages.includes(l)}
                    disabled={!canEdit}
                    onCheckedChange={(v) =>
                      setLanguages(
                        v ? [...new Set([...languages, l])] : languages.filter((x) => x !== l)
                      )
                    }
                  />
                  {l}
                </Label>
              ))}
            </div>
          </Field>
        </div>
        {canEdit && (
          <div className='flex flex-wrap items-center gap-2'>
            <Button onClick={save} disabled={pending} data-testid='ai-profile-save'>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              {isNew || !current ? t('create') : t('save')}
            </Button>
            {current && (
              <Button variant='ghost' onClick={() => setDeleting(true)} disabled={remove.isPending}>
                <Icons.trash className='size-4' /> {t('delete')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
      <AlertModal
        isOpen={deleting}
        onClose={() => setDeleting(false)}
        loading={remove.isPending}
        title={t('delete')}
        description={tc('confirmDescription')}
        confirmLabel={tc('delete')}
        onConfirm={() =>
          current &&
          remove.mutate(
            { id: current.id },
            {
              onSuccess: () => {
                toast.success(t('deleted'));
                setDeleting(false);
                onProfileChange(null);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
    </Card>
  );
}
