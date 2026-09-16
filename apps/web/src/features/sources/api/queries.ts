import { queryOptions } from '@tanstack/react-query';
import {
  getSourceSettings,
  getSourcesOverview,
  listPlatformAccounts,
  listPlatforms
} from './service';
import type { PlatformKind } from './types';

export const sourceKeys = {
  all: ['sources'] as const,
  platforms: (kind?: PlatformKind) => [...sourceKeys.all, 'platforms', kind ?? 'all'] as const,
  accounts: () => [...sourceKeys.all, 'accounts'] as const,
  overview: (scope: string) => [...sourceKeys.all, 'overview', scope] as const,
  settings: () => [...sourceKeys.all, 'settings'] as const
};

/** Platform registry — rarely changes, cached for the session. */
export const platformsQueryOptions = (kind?: PlatformKind) =>
  queryOptions({
    queryKey: sourceKeys.platforms(kind),
    queryFn: () => listPlatforms(kind),
    staleTime: 30 * 60 * 1000
  });

export const platformAccountsQueryOptions = () =>
  queryOptions({ queryKey: sourceKeys.accounts(), queryFn: listPlatformAccounts });

export const sourcesOverviewQueryOptions = (scope: string) =>
  queryOptions({ queryKey: sourceKeys.overview(scope), queryFn: () => getSourcesOverview(scope) });

export const sourceSettingsQueryOptions = () =>
  queryOptions({ queryKey: sourceKeys.settings(), queryFn: getSourceSettings });
