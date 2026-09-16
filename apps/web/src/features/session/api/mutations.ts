import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { sessionKeys } from './queries';
import {
  acceptInvitation,
  changePassword,
  confirmPasswordReset,
  requestPasswordReset,
  signIn,
  signOut,
  switchTenant,
  updateProfile,
  verifyTwoFactor
} from './service';
import type { InvitationAccept } from './types';

export const signInMutation = () =>
  mutationOptions({ mutationKey: [...sessionKeys.all, 'sign-in'], mutationFn: signIn });
export const verifyTwoFactorMutation = () =>
  mutationOptions({ mutationKey: [...sessionKeys.all, '2fa'], mutationFn: verifyTwoFactor });
export const requestPasswordResetMutation = () =>
  mutationOptions({ mutationKey: [...sessionKeys.all, 'reset'], mutationFn: requestPasswordReset });
export const confirmPasswordResetMutation = () =>
  mutationOptions({
    mutationKey: [...sessionKeys.all, 'reset-confirm'],
    mutationFn: confirmPasswordReset
  });
export const acceptInvitationMutation = (token: string) =>
  mutationOptions({
    mutationKey: [...sessionKeys.all, 'accept-invitation', token],
    mutationFn: (body: InvitationAccept) => acceptInvitation(token, body)
  });

export const signOutMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...sessionKeys.all, 'sign-out'],
    mutationFn: signOut,
    onSuccess: () => queryClient.clear()
  });

export const switchTenantMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...sessionKeys.all, 'switch-tenant'],
    mutationFn: switchTenant,
    onSuccess: (me) => {
      queryClient.clear();
      queryClient.setQueryData(sessionKeys.me(), me);
    }
  });

export const updateProfileMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...sessionKeys.all, 'profile'],
    mutationFn: updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.me() })
  });

export const changePasswordMutation = () =>
  mutationOptions({ mutationKey: [...sessionKeys.all, 'password'], mutationFn: changePassword });
