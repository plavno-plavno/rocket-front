'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppForm } from '@/lib/form';
import { isApiError } from '@/lib/api';
import { signInMutation } from '../api/mutations';
import { AuthCard } from './auth-card';

export const TWO_FACTOR_STORAGE_KEY = 'lp.2fa.challenge';

function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard/overview';
}

export function SignInForm() {
  const t = useTranslations('session.signIn');
  const tv = useTranslations('session.validation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const signIn = useMutation(signInMutation());

  const schema = z.object({
    email: z.string().min(1, tv('emailRequired')).email(tv('emailInvalid')),
    password: z.string().min(1, tv('passwordRequired')),
    remember: z.boolean()
  });

  const form = useAppForm({
    defaultValues: { email: '', password: '', remember: false },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const result = await signIn.mutateAsync(value);
        if (result.status === 'two_factor_required' && result.challenge_token) {
          sessionStorage.setItem(TWO_FACTOR_STORAGE_KEY, result.challenge_token);
          router.push(`/auth/2fa?next=${encodeURIComponent(safeNext(searchParams.get('next')))}`);
          return;
        }
        queryClient.clear();
        router.replace(safeNext(searchParams.get('next')));
      } catch (error) {
        setFormError(
          !isApiError(error) || error.status >= 500
            ? t('unavailable')
            : error.status === 401
              ? t('invalidCredentials')
              : error.message
        );
      }
    }
  });

  return (
    <AuthCard
      title={t('title')}
      description={t('description')}
      footer={
        <Link href='/auth/reset' className='hover:text-foreground underline underline-offset-4'>
          {t('forgot')}
        </Link>
      }
    >
      <form
        className='flex flex-col gap-4'
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        noValidate
      >
        {searchParams.has('expired') && !formError && (
          <Alert>
            <AlertDescription>{t('expired')}</AlertDescription>
          </Alert>
        )}
        {formError && (
          <Alert variant='destructive'>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <form.AppField
          name='email'
          children={(field) => (
            <field.TextField label={t('email')} type='email' autoComplete='email' autoFocus />
          )}
        />
        <form.AppField
          name='password'
          children={(field) => (
            <field.TextField
              label={t('password')}
              type='password'
              autoComplete='current-password'
            />
          )}
        />
        <form.AppField
          name='remember'
          children={(field) => <field.CheckboxField label={t('remember')} />}
        />
        <form.AppForm>
          <form.SubmitButton className='w-full'>{t('submit')}</form.SubmitButton>
        </form.AppForm>
        {process.env.NODE_ENV !== 'production' && (
          <p className='text-muted-foreground text-center text-xs'>
            {t('demoHint', { email: 'owner@example.ru', password: 'password' })}
          </p>
        )}
      </form>
    </AuthCard>
  );
}
