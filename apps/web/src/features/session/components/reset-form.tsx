'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppForm } from '@/lib/form';
import { isApiError } from '@/lib/api';
import { confirmPasswordResetMutation, requestPasswordResetMutation } from '../api/mutations';
import { AuthCard } from './auth-card';

const backLink = (label: string) => (
  <Link href='/auth/sign-in' className='hover:text-foreground underline underline-offset-4'>
    {label}
  </Link>
);

/** Step 1 — request the reset email. */
export function ResetRequestForm() {
  const t = useTranslations('session.reset');
  const ts = useTranslations('session.signIn');
  const tv = useTranslations('session.validation');
  const [sent, setSent] = useState(false);
  const request = useMutation(requestPasswordResetMutation());

  const form = useAppForm({
    defaultValues: { email: '' },
    validators: {
      onSubmit: z.object({
        email: z.string().min(1, tv('emailRequired')).email(tv('emailInvalid'))
      })
    },
    onSubmit: async ({ value }) => {
      await request.mutateAsync(value);
      setSent(true);
    }
  });

  return (
    <AuthCard
      title={t('title')}
      description={t('description')}
      footer={backLink(t('backToSignIn'))}
    >
      {sent ? (
        <Alert>
          <AlertDescription>{t('sent')}</AlertDescription>
        </Alert>
      ) : (
        <form
          className='flex flex-col gap-4'
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          noValidate
        >
          <form.AppField
            name='email'
            children={(field) => (
              <field.TextField label={ts('email')} type='email' autoComplete='email' autoFocus />
            )}
          />
          <form.AppForm>
            <form.SubmitButton className='w-full'>{t('submit')}</form.SubmitButton>
          </form.AppForm>
        </form>
      )}
    </AuthCard>
  );
}

/** Step 2 — set the new password using the token from the email link. */
export function ResetConfirmForm({ token }: { token: string }) {
  const t = useTranslations('session.reset');
  const tv = useTranslations('session.validation');
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const confirm = useMutation(confirmPasswordResetMutation());

  const schema = z
    .object({
      password: z.string().min(8, tv('passwordMin', { min: 8 })),
      confirm: z.string()
    })
    .refine((v) => v.password === v.confirm, {
      message: t('passwordsMismatch'),
      path: ['confirm']
    });

  const form = useAppForm({
    defaultValues: { password: '', confirm: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        await confirm.mutateAsync({ token, password: value.password });
        toast.success(t('done'));
        router.replace('/auth/sign-in');
      } catch (error) {
        setFormError(
          isApiError(error) && error.status === 410 ? t('tokenExpired') : (error as Error).message
        );
      }
    }
  });

  return (
    <AuthCard
      title={t('newPasswordTitle')}
      description={t('newPasswordDescription')}
      footer={backLink(t('backToSignIn'))}
    >
      <form
        className='flex flex-col gap-4'
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        noValidate
      >
        {formError && (
          <Alert variant='destructive'>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <form.AppField
          name='password'
          children={(field) => (
            <field.TextField
              label={t('newPassword')}
              type='password'
              autoComplete='new-password'
              autoFocus
            />
          )}
        />
        <form.AppField
          name='confirm'
          children={(field) => (
            <field.TextField
              label={t('confirmPassword')}
              type='password'
              autoComplete='new-password'
            />
          )}
        />
        <form.AppForm>
          <form.SubmitButton className='w-full'>{t('setPassword')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </AuthCard>
  );
}
