import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListUsersQuery, ListInvitationsQuery } from './types';

/** GET /users — List tenant members */
export async function listUsers(params?: ListUsersQuery) {
  const { data } = await coreClient().GET('/users', { params: { query: query(params ?? {}) } });
  return data!;
}

/** GET /users/{id} — Get member */
export async function getUser(id: string) {
  const { data } = await coreClient().GET('/users/{id}', { params: { path: { id } } });
  return data!;
}

/** PATCH /users/{id} — Update member role, scope or status */
export async function updateUser(id: string, body: OperationBody<'update_user'>) {
  const { data } = await coreClient().PATCH('/users/{id}', { params: { path: { id } }, body });
  return data!;
}

/** DELETE /users/{id} — Remove member from tenant */
export async function removeUser(id: string) {
  await coreClient().DELETE('/users/{id}', { params: { path: { id } } });
}

/** GET /invitations — List pending invitations */
export async function listInvitations(params?: ListInvitationsQuery) {
  const { data } = await coreClient().GET('/invitations', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /invitations — Invite users by email */
export async function createInvitations(body: OperationBody<'create_invitations'>) {
  const { data } = await coreClient().POST('/invitations', { body });
  return data!;
}

/** DELETE /invitations/{id} — Revoke invitation */
export async function revokeInvitation(id: string) {
  await coreClient().DELETE('/invitations/{id}', { params: { path: { id } } });
}

/** POST /invitations/{id}/resend — Resend invitation email */
export async function resendInvitation(id: string) {
  await coreClient().POST('/invitations/{id}/resend', { params: { path: { id } } });
}
