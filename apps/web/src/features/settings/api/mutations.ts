import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { settingsKeys } from './queries';
import {
  updateTenant,
  createApiKey,
  revokeApiKey,
  createIntegrationsWebhook,
  updateIntegrationsWebhook,
  deleteIntegrationsWebhook,
  testWebhook
} from './service';

export const updateTenantMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...settingsKeys.all, 'update_tenant'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateTenant>[1] }) =>
      updateTenant(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all })
  });

export const createApiKeyMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...settingsKeys.all, 'create_api_key'],
    mutationFn: ({ body }: { body: Parameters<typeof createApiKey>[0] }) => createApiKey(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all })
  });

export const revokeApiKeyMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...settingsKeys.all, 'revoke_api_key'],
    mutationFn: ({ id }: { id: string }) => revokeApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all })
  });

export const createIntegrationsWebhookMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...settingsKeys.all, 'create_integrations_webhook'],
    mutationFn: ({ body }: { body: Parameters<typeof createIntegrationsWebhook>[0] }) =>
      createIntegrationsWebhook(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all })
  });

export const updateIntegrationsWebhookMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...settingsKeys.all, 'update_integrations_webhook'],
    mutationFn: ({
      id,
      body
    }: {
      id: string;
      body: Parameters<typeof updateIntegrationsWebhook>[1];
    }) => updateIntegrationsWebhook(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all })
  });

export const deleteIntegrationsWebhookMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...settingsKeys.all, 'delete_integrations_webhook'],
    mutationFn: ({ id }: { id: string }) => deleteIntegrationsWebhook(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all })
  });

export const testWebhookMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...settingsKeys.all, 'test_webhook'],
    mutationFn: ({ id }: { id: string }) => testWebhook(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all })
  });
