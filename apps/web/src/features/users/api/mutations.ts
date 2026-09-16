import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { usersKeys } from './queries';
import {
  updateUser,
  removeUser,
  createInvitations,
  revokeInvitation,
  resendInvitation
} from './service';

export const updateUserMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...usersKeys.all, 'update_user'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all })
  });

export const removeUserMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...usersKeys.all, 'remove_user'],
    mutationFn: ({ id }: { id: string }) => removeUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all })
  });

export const createInvitationsMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...usersKeys.all, 'create_invitations'],
    mutationFn: ({ body }: { body: Parameters<typeof createInvitations>[0] }) =>
      createInvitations(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all })
  });

export const revokeInvitationMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...usersKeys.all, 'revoke_invitation'],
    mutationFn: ({ id }: { id: string }) => revokeInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all })
  });

export const resendInvitationMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...usersKeys.all, 'resend_invitation'],
    mutationFn: ({ id }: { id: string }) => resendInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all })
  });
