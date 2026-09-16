'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppForm } from '@/lib/form';
import { isApiError } from '@/lib/api';
import { acceptInvitationMutation } from '../api/mutations';
import { invitationQueryOptions } from '../api/queries';
import { AuthCard } from './auth-card';

export function InviteForm({ token }: { token: string }) {
  const t = useTranslations('session.invite');
  const tv = useTranslations('session.validation');
  const tr = useTranslations('roles');
  const tReset = useTranslations('session.reset');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const invitation = useQuery(invitationQueryOptions(token));
  const accept = useMutation(acceptInvitationMutation(token));

  const form = useAppForm({
    defaultValues: { name: '', password: '' },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, tv('nameRequired')),
        password: z.string().min(8, tv('passwordMin', { min: 8 }))
      })
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        await accept.mutateAsync(value);
        queryClient.clear();
        router.replace('/dashboard/overview');
      } catch (error) {
        setFormError(
          isApiError(error) && error.status === 410 ? t('expired') : (error as Error).message
        );
      }
    }
  });

  if (invitation.isPending) {
    return (
      <AuthCard title={t('title', { tenant: '…' })}>
        <Skeleton className='h-9 w-full' />
        <Skeleton className='h-9 w-full' />
      </AuthCard>
    );
  }

  if (invitation.isError) {
    const expired = isApiError(invitation.error) && invitation.error.status === 410;
    return (
      <AuthCard title={t('title', { tenant: '' })}>
        <Alert variant='destructive'>
          <AlertDescription>{expired ? t('expired') : t('invalid')}</AlertDescription>
        </Alert>
        <Link
          href='/auth/sign-in'
          className='text-muted-foreground text-center text-sm underline underline-offset-4'
        >
          {tReset('backToSignIn')}
        </Link>
      </AuthCard>
    );
  }

  const inv = invitation.data;
  return (
    <AuthCard
      title={t('title', { tenant: inv.tenant_name })}
      description={t('description', { role: tr(inv.role) })}
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
        <div className='text-muted-foreground text-sm'>{inv.email}</div>
        <form.AppField
          name='name'
          children={(field) => <field.TextField label={t('name')} autoComplete='name' autoFocus />}
        />
        <form.AppField
          name='password'
          children={(field) => (
            <field.TextField label={t('password')} type='password' autoComplete='new-password' />
          )}
        />
        <form.AppForm>
          <form.SubmitButton className='w-full'>{t('submit')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </AuthCard>
  );
}
