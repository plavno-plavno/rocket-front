'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocationPicker } from '@/features/locations';
import { useMe, type Role } from '@/features/session';
import { isApiError } from '@/lib/api';
import { createInvitationsMutation, updateUserMutation } from '../api/mutations';
import type { Membership } from '../api/types';

type AccessRule = Membership['access_rule'];

const ROLES: Role[] = ['owner', 'admin', 'reputation_manager', 'observer'];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function toRule(mode: 'all' | 'selected', locationIds: string[], groupIds: string[]): AccessRule {
  if (mode === 'all') return { mode: 'all' };
  if (locationIds.length === 0 && groupIds.length > 0)
    return { mode: 'groups', group_ids: groupIds };
  return { mode: 'locations', location_ids: locationIds, group_ids: groupIds };
}

/** Chips input for invitation emails: Enter / comma / space / paste of a list. */
function EmailsInput({
  value,
  onChange,
  invalid
}: {
  value: string[];
  onChange: (v: string[]) => void;
  invalid: string[];
}) {
  const t = useTranslations('users.sheet');
  const [draft, setDraft] = useState('');
  const commit = (raw: string) => {
    const parts = raw
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!parts.length) return;
    onChange([...new Set([...value, ...parts])]);
    setDraft('');
  };
  return (
    <div
      className='border-input focus-within:ring-ring/50 flex min-h-10 flex-wrap items-center gap-1 rounded-md border p-1.5 focus-within:ring-[3px]'
      data-testid='invite-emails'
    >
      {value.map((email) => (
        <Badge
          key={email}
          variant={invalid.includes(email) ? 'destructive' : 'secondary'}
          className='gap-1 font-normal'
        >
          {email}
          <button
            type='button'
            aria-label={t('removeEmail', { email })}
            onClick={() => onChange(value.filter((x) => x !== email))}
            className='hover:text-foreground opacity-70'
          >
            <Icons.close className='size-3' />
          </button>
        </Badge>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
            e.preventDefault();
            commit(draft);
          }
          if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => commit(draft)}
        onPaste={(e) => {
          e.preventDefault();
          commit(e.clipboardData.getData('text'));
        }}
        placeholder={value.length ? '' : t('emailsPlaceholder')}
        aria-label={t('emails')}
        type='email'
        className='min-w-40 flex-1 bg-transparent px-1 text-sm outline-none'
      />
    </div>
  );
}

export interface UserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing an existing member (role + access); `null` = invite new users. */
  member: Membership | null;
}

/** Sheet «Добавить пользователей» / «Изменить доступ» (S-SET-01): emails, role, access rules via `LocationPicker`. */
export function UserSheet({ open, onOpenChange, member }: UserSheetProps) {
  const t = useTranslations('users.sheet');
  const tr = useTranslations('users.roles');
  const ta = useTranslations('users.actions');
  const me = useMe();
  const queryClient = useQueryClient();
  const invite = useMutation(createInvitationsMutation(queryClient));
  const update = useMutation(updateUserMutation(queryClient));

  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<Role>('reputation_manager');
  const [mode, setMode] = useState<'all' | 'selected'>('all');
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ emails?: string; role?: string; access?: string }>({});
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmails([]);
    setRole(member?.role ?? 'reputation_manager');
    const rule = member?.access_rule;
    setMode(rule && rule.mode !== 'all' ? 'selected' : 'all');
    setLocationIds(rule?.location_ids ?? []);
    setGroupIds(rule?.group_ids ?? []);
    setErrors({});
    setInvalidEmails([]);
    setApiError(null);
  }, [open, member]);

  const roles = ROLES.filter((r) => r !== 'owner' || me.role === 'owner');
  const selectedCount = locationIds.length + groupIds.length;
  const pending = invite.isPending || update.isPending;

  const submit = async () => {
    const next: typeof errors = {};
    const bad = emails.filter((e) => !EMAIL_RE.test(e));
    setInvalidEmails(bad);
    if (!member && emails.length === 0) next.emails = t('emailsRequired');
    else if (bad.length) next.emails = t('emailsInvalid', { count: bad.length });
    if (mode === 'selected' && selectedCount === 0) next.access = t('accessRequired');
    setErrors(next);
    if (Object.keys(next).length) return;
    const access_rule = toRule(mode, locationIds, groupIds);
    try {
      if (member) {
        await update.mutateAsync({ id: member.user.id, body: { role, access_rule } });
        toast.success(ta('updated'));
      } else {
        await invite.mutateAsync({ body: { emails, role, access_rule } });
        toast.success(ta('invited', { count: emails.length }));
      }
      onOpenChange(false);
    } catch (e) {
      if (isApiError(e) && e.fieldErrors.emails) setErrors({ emails: e.fieldErrors.emails });
      else if (isApiError(e) && e.fieldErrors.role) setErrors({ role: e.fieldErrors.role });
      else setApiError(errorText(e));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-xl' data-testid='user-sheet'>
        <SheetHeader className='border-b'>
          <SheetTitle>{member ? t('editTitle') : t('inviteTitle')}</SheetTitle>
          <SheetDescription>
            {member ? `${member.user.name} · ${member.user.email}` : t('inviteDescription')}
          </SheetDescription>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-5 overflow-y-auto p-4'>
          {apiError && (
            <Alert variant='destructive'>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          {!member && (
            <Field>
              <FieldLabel>{t('emails')} *</FieldLabel>
              <EmailsInput value={emails} onChange={setEmails} invalid={invalidEmails} />
              <FieldDescription>{t('emailsHint')}</FieldDescription>
              {errors.emails && <FieldError>{errors.emails}</FieldError>}
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor='user-role'>{t('role')} *</FieldLabel>
            <Select value={role} onValueChange={(v) => setRole((v as Role) ?? 'observer')}>
              <SelectTrigger id='user-role' aria-label={t('role')} data-testid='user-role'>
                <SelectValue>{(v: string) => tr(`${v as Role}.title`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    <span className='flex flex-col'>
                      <span>{tr(`${r}.title`)}</span>
                      <span className='text-muted-foreground text-xs'>{tr(`${r}.hint`)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <FieldError>{errors.role}</FieldError>}
          </Field>

          <Tabs defaultValue='access'>
            <TabsList>
              <TabsTrigger value='access'>{t('accessTab')}</TabsTrigger>
            </TabsList>
            <TabsContent value='access' className='flex flex-col gap-4 pt-3'>
              <RadioGroup
                value={mode}
                onValueChange={(v) => setMode((v as 'all' | 'selected') ?? 'all')}
                className='flex flex-col gap-3'
              >
                <Label className='flex items-start gap-3 font-normal'>
                  <RadioGroupItem value='all' id='access-all' className='mt-0.5' />
                  <span className='flex flex-col'>
                    <span className='font-medium'>{t('accessAll')}</span>
                    <span className='text-muted-foreground text-xs'>{t('accessAllHint')}</span>
                  </span>
                </Label>
                <Label className='flex items-start gap-3 font-normal'>
                  <RadioGroupItem value='selected' id='access-selected' className='mt-0.5' />
                  <span className='flex flex-col'>
                    <span className='font-medium'>{t('accessSelected')}</span>
                    <span className='text-muted-foreground text-xs'>{t('accessSelectedHint')}</span>
                  </span>
                </Label>
              </RadioGroup>
              {mode === 'selected' && (
                <div className='flex flex-wrap items-center gap-3 rounded-md border p-3'>
                  <span className='text-sm' data-testid='access-count'>
                    {t('selected', { count: selectedCount })}
                  </span>
                  <LocationPicker
                    value={{ location_ids: locationIds, group_ids: groupIds }}
                    onChange={(v) => {
                      setLocationIds(v.location_ids);
                      setGroupIds(v.group_ids);
                    }}
                    allowGroups
                  />
                  {errors.access && <FieldError className='basis-full'>{errors.access}</FieldError>}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {!member && (
            <Alert>
              <Icons.mailForward className='size-4' />
              <AlertDescription>{t('inviteNotice')}</AlertDescription>
            </Alert>
          )}
        </div>
        <SheetFooter className='flex-row justify-end gap-2 border-t'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending} data-testid='user-sheet-submit'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {member ? t('saveOne') : t('save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
