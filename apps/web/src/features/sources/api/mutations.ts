import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { sourceKeys } from './queries';
import {
  checkPlatformAccount,
  createPlatformAccount,
  deletePlatformAccount,
  startPlatformAccountOAuth,
  updateSourceSettings
} from './service';

export const createPlatformAccountMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...sourceKeys.all, 'account-create'],
    mutationFn: createPlatformAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: sourceKeys.all })
  });

export const deletePlatformAccountMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...sourceKeys.all, 'account-delete'],
    mutationFn: deletePlatformAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: sourceKeys.all })
  });

export const startOAuthMutation = () =>
  mutationOptions({
    mutationKey: [...sourceKeys.all, 'oauth'],
    mutationFn: startPlatformAccountOAuth
  });

export const checkPlatformAccountMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...sourceKeys.all, 'account-check'],
    mutationFn: checkPlatformAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: sourceKeys.accounts() })
  });

export const updateSourceSettingsMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...sourceKeys.all, 'settings'],
    mutationFn: updateSourceSettings,
    onSuccess: (data) => qc.setQueryData(sourceKeys.settings(), data)
  });
