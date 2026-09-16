import { coreClient } from '@/lib/api';
import type {
  InvitationAccept,
  PasswordChange,
  PasswordResetConfirm,
  PasswordResetRequest,
  ProfileUpdate,
  SignInRequest,
  TwoFactorRequest
} from './types';

export async function getMe() {
  const { data } = await coreClient().GET('/me');
  return data!;
}

export async function getBadges(scope: string) {
  const { data } = await coreClient().GET('/me/badges', { params: { query: { scope } } });
  return data!;
}

export async function signIn(body: SignInRequest) {
  const { data } = await coreClient().POST('/auth/sign-in', { body });
  return data!;
}

export async function verifyTwoFactor(body: TwoFactorRequest) {
  const { data } = await coreClient().POST('/auth/2fa', { body });
  return data!;
}

export async function signOut() {
  await coreClient().POST('/auth/sign-out');
}

export async function requestPasswordReset(body: PasswordResetRequest) {
  await coreClient().POST('/auth/password-reset', { body });
}

export async function confirmPasswordReset(body: PasswordResetConfirm) {
  await coreClient().POST('/auth/password-reset/confirm', { body });
}

export async function getInvitation(token: string) {
  const { data } = await coreClient().GET('/auth/invitations/{token}', {
    params: { path: { token } }
  });
  return data!;
}

export async function acceptInvitation(token: string, body: InvitationAccept) {
  const { data } = await coreClient().POST('/auth/invitations/{token}/accept', {
    params: { path: { token } },
    body
  });
  return data!;
}

export async function switchTenant(tenantId: string) {
  const { data } = await coreClient().POST('/me/switch-tenant', { body: { tenant_id: tenantId } });
  return data!;
}

export async function updateProfile(body: ProfileUpdate) {
  const { data } = await coreClient().PATCH('/me', { body });
  return data!;
}

export async function changePassword(body: PasswordChange) {
  await coreClient().POST('/me/password', { body });
}
