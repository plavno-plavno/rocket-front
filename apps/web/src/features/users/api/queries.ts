import { queryOptions } from '@tanstack/react-query';
import { listUsers, getUser, listInvitations } from './service';
import type { ListUsersQuery, ListInvitationsQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const usersKeys = {
  all: ['users'] as const,
  users: (params?: ListUsersQuery) => [...usersKeys.all, 'users', params ?? {}] as const,
  user: (id: string) => [...usersKeys.all, 'user', id] as const,
  invitations: (params?: ListInvitationsQuery) =>
    [...usersKeys.all, 'invitations', params ?? {}] as const
};

export const usersQueryOptions = (params?: ListUsersQuery) =>
  queryOptions({ queryKey: usersKeys.users(params), queryFn: () => listUsers(params) });

export const userQueryOptions = (id: string) =>
  queryOptions({ queryKey: usersKeys.user(id), queryFn: () => getUser(id) });

export const invitationsQueryOptions = (params?: ListInvitationsQuery) =>
  queryOptions({ queryKey: usersKeys.invitations(params), queryFn: () => listInvitations(params) });
