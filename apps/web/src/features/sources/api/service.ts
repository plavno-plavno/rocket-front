import { coreClient, query } from '@/lib/api';
import type { PlatformAccountCreate, PlatformKind, SourceSettings } from './types';

export async function listPlatforms(kind?: PlatformKind) {
  const { data } = await coreClient().GET('/platforms', {
    params: { query: query({ 'filter[kind]': kind }) }
  });
  return data!;
}

export async function listPlatformAccounts() {
  const { data } = await coreClient().GET('/platform-accounts');
  return data!;
}

export async function createPlatformAccount(body: PlatformAccountCreate) {
  const { data } = await coreClient().POST('/platform-accounts', { body });
  return data!;
}

export async function deletePlatformAccount(id: string) {
  await coreClient().DELETE('/platform-accounts/{id}', { params: { path: { id } } });
}

export async function startPlatformAccountOAuth(id: string) {
  const { data } = await coreClient().POST('/platform-accounts/{id}/oauth/start', {
    params: { path: { id } }
  });
  return data!;
}

export async function checkPlatformAccount(id: string) {
  const { data } = await coreClient().POST('/platform-accounts/{id}/check', {
    params: { path: { id } }
  });
  return data!;
}

export async function getSourcesOverview(scope: string) {
  const { data } = await coreClient().GET('/sources/overview', { params: { query: { scope } } });
  return data!;
}

export async function getSourceSettings() {
  const { data } = await coreClient().GET('/settings/sources');
  return data!;
}

export async function updateSourceSettings(body: SourceSettings) {
  const { data } = await coreClient().PUT('/settings/sources', { body });
  return data!;
}
