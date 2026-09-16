import { queryOptions } from '@tanstack/react-query';
import { getBadges, getInvitation, getMe } from './service';

export const sessionKeys = {
  all: ['session'] as const,
  me: () => [...sessionKeys.all, 'me'] as const,
  badges: (scope: string) => [...sessionKeys.all, 'badges', scope] as const,
  invitation: (token: string) => [...sessionKeys.all, 'invitation', token] as const
};

export const meQueryOptions = () =>
  queryOptions({
    queryKey: sessionKeys.me(),
    queryFn: getMe,
    staleTime: 5 * 60 * 1000
  });

export const badgesQueryOptions = (scope: string) =>
  queryOptions({
    queryKey: sessionKeys.badges(scope),
    queryFn: () => getBadges(scope),
    staleTime: 60 * 1000
  });

export const invitationQueryOptions = (token: string) =>
  queryOptions({
    queryKey: sessionKeys.invitation(token),
    queryFn: () => getInvitation(token),
    retry: false
  });
