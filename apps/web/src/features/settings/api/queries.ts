import { queryOptions } from '@tanstack/react-query';
import {
  getTenant,
  listApiKeys,
  listIntegrationsWebhooks,
  getIntegrationsWebhook,
  listWebhookDeliveries
} from './service';
import type { ListIntegrationsWebhooksQuery, ListWebhookDeliveriesQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const settingsKeys = {
  all: ['settings'] as const,
  tenant: (id: string) => [...settingsKeys.all, 'tenant', id] as const,
  apiKeys: () => [...settingsKeys.all, 'apiKeys'] as const,
  integrationsWebhooks: (params?: ListIntegrationsWebhooksQuery) =>
    [...settingsKeys.all, 'integrationsWebhooks', params ?? {}] as const,
  integrationsWebhook: (id: string) => [...settingsKeys.all, 'integrationsWebhook', id] as const,
  webhookDeliveries: (id: string, params?: ListWebhookDeliveriesQuery) =>
    [...settingsKeys.all, 'webhookDeliveries', id, params ?? {}] as const
};

export const tenantQueryOptions = (id: string) =>
  queryOptions({ queryKey: settingsKeys.tenant(id), queryFn: () => getTenant(id) });

export const apiKeysQueryOptions = () =>
  queryOptions({ queryKey: settingsKeys.apiKeys(), queryFn: () => listApiKeys() });

export const integrationsWebhooksQueryOptions = (params?: ListIntegrationsWebhooksQuery) =>
  queryOptions({
    queryKey: settingsKeys.integrationsWebhooks(params),
    queryFn: () => listIntegrationsWebhooks(params)
  });

export const integrationsWebhookQueryOptions = (id: string) =>
  queryOptions({
    queryKey: settingsKeys.integrationsWebhook(id),
    queryFn: () => getIntegrationsWebhook(id)
  });

export const webhookDeliveriesQueryOptions = (id: string, params?: ListWebhookDeliveriesQuery) =>
  queryOptions({
    queryKey: settingsKeys.webhookDeliveries(id, params),
    queryFn: () => listWebhookDeliveries(id, params)
  });
