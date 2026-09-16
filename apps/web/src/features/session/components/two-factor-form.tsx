'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppForm } from '@/lib/form';
import { isApiError } from '@/lib/api';
import { verifyTwoFactorMutation } from '../api/mutations';
import { AuthCard } from './auth-card';
import { TWO_FACTOR_STORAGE_KEY } from './sign-in-form';

export function TwoFactorForm() {
  const t = useTranslations('session.twoFactor');
  const tv = useTranslations('session.validation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [challenge, setChallenge] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const verify = useMutation(verifyTwoFactorMutation());

  useEffect(() => {
    const token = sessionStorage.getItem(TWO_FACTOR_STORAGE_KEY);
    if (!token) router.replace('/auth/sign-in');
    else setChallenge(token);
  }, [router]);

  const form = useAppForm({
    defaultValues: { code: '' },
    validators: { onSubmit: z.object({ code: z.string().length(6, tv('codeLength')) }) },
    onSubmit: async ({ value }) => {
      if (!challenge) return;
      setFormError(null);
      try {
        await verify.mutateAsync({ challenge_token: challenge, code: value.code });
        sessionStorage.removeItem(TWO_FACTOR_STORAGE_KEY);
        queryClient.clear();
        const next = searchParams.get('next');
        router.replace(next && next.startsWith('/') ? next : '/dashboard/overview');
      } catch (error) {
        if (isApiError(error) && error.status === 422) setFormError(t('invalidCode'));
        else if (isApiError(error) && error.status === 401) setFormError(t('expired'));
        else setFormError((error as Error).message);
      }
    }
  });

  return (
    <AuthCard
      title={t('title')}
      description={t('description')}
      footer={
        <Link href='/auth/sign-in' className='hover:text-foreground underline underline-offset-4'>
          {t('back')}
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
        {formError && (
          <Alert variant='destructive'>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <form.AppField name='code' children={(field) => <field.OtpField label={t('code')} />} />
        <form.AppForm>
          <form.SubmitButton className='w-full' disabled={!challenge}>
            {t('submit')}
          </form.SubmitButton>
        </form.AppForm>
      </form>
    </AuthCard>
  );
}
