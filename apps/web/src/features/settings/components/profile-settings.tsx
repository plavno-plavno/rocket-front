'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { changePasswordMutation, updateProfileMutation, useCan, useMe } from '@/features/session';
import { isApiError } from '@/lib/api';
import { useAppForm } from '@/lib/form';
import { LOCALES } from '@/lib/i18n';
import { setLocaleAction } from '@/lib/i18n/actions';
import { updateTenantMutation } from '../api/mutations';
import { tenantQueryOptions } from '../api/queries';

export const TIMEZONES = [
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka'
];

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** «Профиль»: name + interface language; the language is applied immediately via the locale cookie. */
function ProfileCard() {
  const t = useTranslations('settings.profile');
  const tl = useTranslations('locales');
  const tv = useTranslations('settings.validation');
  const me = useMe();
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const update = useMutation(updateProfileMutation(queryClient));
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { name: me.user.name, locale: me.user.locale },
    validators: {
      onSubmit: z.object({ name: z.string().trim().min(1, tv('nameRequired')), locale: z.string() })
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await update.mutateAsync({ name: value.name.trim(), locale: value.locale });
        if (value.locale !== locale) {
          await setLocaleAction(value.locale);
          router.refresh();
        }
        toast.success(t('saved'));
      } catch (e) {
        setError(errorText(e));
      }
    }
  });

  return (
    <Card data-testid='profile-card'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        noValidate
      >
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-center gap-4'>
            <Avatar className='size-14'>
              {me.user.avatar_url && <AvatarImage src={me.user.avatar_url} alt='' />}
              <AvatarFallback className='text-base'>{initials(me.user.name)}</AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='truncate font-medium'>{me.user.name}</p>
              <p className='text-muted-foreground truncate text-sm'>{me.user.email}</p>
              <Badge variant='outline' className='mt-1'>
                {t(`roles.${me.role}`)}
              </Badge>
            </div>
          </div>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className='grid gap-4 sm:grid-cols-2'>
            <form.AppField
              name='name'
              children={(field) => (
                <field.TextField label={t('name')} required autoComplete='name' />
              )}
            />
            <Field>
              <FieldLabel htmlFor='profile-email'>{t('email')}</FieldLabel>
              <Input id='profile-email' value={me.user.email} readOnly disabled />
              <FieldDescription>{t('emailHint')}</FieldDescription>
            </Field>
            <form.AppField
              name='locale'
              children={(field) => (
                <field.SelectField
                  label={t('locale')}
                  description={t('localeHint')}
                  options={LOCALES.map((l) => ({ value: l, label: tl(l) }))}
                />
              )}
            />
          </div>
        </CardContent>
        <CardFooter className='justify-end'>
          <form.AppForm>
            <form.SubmitButton>{t('save')}</form.SubmitButton>
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}

/** «Пароль»: current → new (min 8) + confirmation; 422 from core maps to the field. */
function PasswordCard() {
  const t = useTranslations('settings.password');
  const tv = useTranslations('settings.validation');
  const change = useMutation(changePasswordMutation());
  const [error, setError] = useState<string | null>(null);

  const schema = z
    .object({
      current_password: z.string().min(1, tv('passwordRequired')),
      new_password: z.string().min(8, tv('passwordShort')),
      confirm: z.string()
    })
    .refine((v) => v.new_password === v.confirm, {
      path: ['confirm'],
      message: tv('passwordMismatch')
    });

  const form = useAppForm({
    defaultValues: { current_password: '', new_password: '', confirm: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      setError(null);
      try {
        await change.mutateAsync({
          current_password: value.current_password,
          new_password: value.new_password
        });
        toast.success(t('changed'));
        formApi.reset();
      } catch (e) {
        setError(
          isApiError(e) && e.fieldErrors.current_password
            ? e.fieldErrors.current_password
            : errorText(e)
        );
      }
    }
  });

  return (
    <Card data-testid='password-card'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        noValidate
      >
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form.AppField
            name='current_password'
            children={(field) => (
              <field.TextField
                label={t('current')}
                type='password'
                autoComplete='current-password'
                required
              />
            )}
          />
          <div className='grid gap-4 sm:grid-cols-2'>
            <form.AppField
              name='new_password'
              children={(field) => (
                <field.TextField
                  label={t('new')}
                  description={t('newHint')}
                  type='password'
                  autoComplete='new-password'
                  required
                />
              )}
            />
            <form.AppField
              name='confirm'
              children={(field) => (
                <field.TextField
                  label={t('confirm')}
                  type='password'
                  autoComplete='new-password'
                  required
                />
              )}
            />
          </div>
        </CardContent>
        <CardFooter className='justify-end'>
          <form.AppForm>
            <form.SubmitButton variant='outline'>{t('save')}</form.SubmitButton>
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}

/** «Двухфакторная защита»: status only — enabling / disabling needs a contract endpoint (CHANGE_REQUESTS). */
function TwoFactorCard() {
  const t = useTranslations('settings.twoFactor');
  const me = useMe();
  const enabled = me.user.two_factor_enabled ?? false;
  return (
    <Card data-testid='two-factor-card'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-3'>
          {enabled ? (
            <Icons.shieldCheck className='text-status-synced size-6' />
          ) : (
            <Icons.shieldOff className='text-muted-foreground size-6' />
          )}
          <div>
            <p className='font-medium'>{enabled ? t('enabled') : t('disabled')}</p>
            <p className='text-muted-foreground text-sm'>
              {enabled ? t('enabledHint') : t('disabledHint')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** «Организация»: tenant name, timezone, locale, plan summary (admins and owners). */
function TenantCard() {
  const t = useTranslations('settings.tenant');
  const tl = useTranslations('locales');
  const tv = useTranslations('settings.validation');
  const me = useMe();
  const queryClient = useQueryClient();
  const { data: tenant } = useQuery(tenantQueryOptions(me.tenant.id));
  const update = useMutation(updateTenantMutation(queryClient));
  const [error, setError] = useState<string | null>(null);
  const current = tenant ?? me.tenant;

  const form = useAppForm({
    defaultValues: { name: current.name, timezone: current.timezone, locale: current.locale },
    validators: {
      onSubmit: z.object({
        name: z.string().trim().min(1, tv('nameRequired')),
        timezone: z.string(),
        locale: z.string()
      })
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await update.mutateAsync({ id: me.tenant.id, body: { ...value, name: value.name.trim() } });
        await queryClient.invalidateQueries({ queryKey: ['session'] });
        toast.success(t('saved'));
      } catch (e) {
        setError(errorText(e));
      }
    }
  });

  return (
    <Card data-testid='tenant-card'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        noValidate
      >
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className='grid gap-4 sm:grid-cols-2'>
            <form.AppField
              name='name'
              children={(field) => <field.TextField label={t('name')} required />}
            />
            <form.AppField
              name='timezone'
              children={(field) => (
                <field.SelectField
                  label={t('timezone')}
                  options={TIMEZONES.map((z) => ({ value: z, label: z }))}
                />
              )}
            />
            <form.AppField
              name='locale'
              children={(field) => (
                <field.SelectField
                  label={t('locale')}
                  options={LOCALES.map((l) => ({ value: l, label: tl(l) }))}
                />
              )}
            />
            <Field>
              <FieldLabel>{t('plan')}</FieldLabel>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge>{current.plan.name}</Badge>
                {current.plan.limits?.locations != null && (
                  <span className='text-muted-foreground text-sm'>
                    {t('limits', {
                      locations: current.plan.limits.locations,
                      users: current.plan.limits.users ?? 0
                    })}
                  </span>
                )}
              </div>
            </Field>
          </div>
        </CardContent>
        <CardFooter className='justify-end'>
          <form.AppForm>
            <form.SubmitButton>{t('save')}</form.SubmitButton>
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}

/** S-SET-02 «Профиль» body: profile, password, 2FA, organisation (owner / admin). */
export function ProfileSettings() {
  const canManageTenant = useCan('users.manage');
  return (
    <>
      <ProfileCard />
      <PasswordCard />
      <TwoFactorCard />
      {canManageTenant && <TenantCard />}
    </>
  );
}
