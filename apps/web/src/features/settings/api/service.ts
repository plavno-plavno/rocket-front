import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListIntegrationsWebhooksQuery, ListWebhookDeliveriesQuery } from './types';

/** GET /tenants/{id} — Get tenant */
export async function getTenant(id: string) {
  const { data } = await coreClient().GET('/tenants/{id}', { params: { path: { id } } });
  return data!;
}

/** PATCH /tenants/{id} — Update tenant */
export async function updateTenant(id: string, body: OperationBody<'update_tenant'>) {
  const { data } = await coreClient().PATCH('/tenants/{id}', { params: { path: { id } }, body });
  return data!;
}

/** GET /integrations/api-keys — API keys */
export async function listApiKeys() {
  const { data } = await coreClient().GET('/integrations/api-keys');
  return data!;
}

/** POST /integrations/api-keys — Create key (secret shown once) */
export async function createApiKey(body: OperationBody<'create_api_key'>) {
  const { data } = await coreClient().POST('/integrations/api-keys', { body });
  return data!;
}

/** DELETE /integrations/api-keys/{id} — Revoke key */
export async function revokeApiKey(id: string) {
  await coreClient().DELETE('/integrations/api-keys/{id}', { params: { path: { id } } });
}

/** GET /integrations/webhooks — List integrations webhooks */
export async function listIntegrationsWebhooks(params?: ListIntegrationsWebhooksQuery) {
  const { data } = await coreClient().GET('/integrations/webhooks', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /integrations/webhooks — Create integrations webhook */
export async function createIntegrationsWebhook(
  body: OperationBody<'create_integrations_webhook'>
) {
  const { data } = await coreClient().POST('/integrations/webhooks', { body });
  return data!;
}

/** GET /integrations/webhooks/{id} — Get integrations webhook */
export async function getIntegrationsWebhook(id: string) {
  const { data } = await coreClient().GET('/integrations/webhooks/{id}', {
    params: { path: { id } }
  });
  return data!;
}

/** PUT /integrations/webhooks/{id} — Update integrations webhook */
export async function updateIntegrationsWebhook(
  id: string,
  body: OperationBody<'update_integrations_webhook'>
) {
  const { data } = await coreClient().PUT('/integrations/webhooks/{id}', {
    params: { path: { id } },
    body
  });
  return data!;
}

/** DELETE /integrations/webhooks/{id} — Delete integrations webhook */
export async function deleteIntegrationsWebhook(id: string) {
  await coreClient().DELETE('/integrations/webhooks/{id}', { params: { path: { id } } });
}

/** GET /integrations/webhooks/{id}/deliveries — Delivery log */
export async function listWebhookDeliveries(id: string, params?: ListWebhookDeliveriesQuery) {
  const { data } = await coreClient().GET('/integrations/webhooks/{id}/deliveries', {
    params: { path: { id }, query: query(params ?? {}) }
  });
  return data!;
}

/** POST /integrations/webhooks/{id}/test — Send a test event */
export async function testWebhook(id: string) {
  const { data } = await coreClient().POST('/integrations/webhooks/{id}/test', {
    params: { path: { id } }
  });
  return data!;
}
