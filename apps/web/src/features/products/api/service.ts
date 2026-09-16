import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListProductsQuery, SyncProductsQuery } from './types';

/** GET /products — List products */
export async function listProducts(params?: ListProductsQuery) {
  const { data } = await coreClient().GET('/products', { params: { query: query(params ?? {}) } });
  return data!;
}

/** POST /products — Create product */
export async function createProduct(body: OperationBody<'create_product'>) {
  const { data } = await coreClient().POST('/products', { body });
  return data!;
}

/** GET /products/{id} — Get product */
export async function getProduct(id: string) {
  const { data } = await coreClient().GET('/products/{id}', { params: { path: { id } } });
  return data!;
}

/** PUT /products/{id} — Update product */
export async function updateProduct(id: string, body: OperationBody<'update_product'>) {
  const { data } = await coreClient().PUT('/products/{id}', { params: { path: { id } }, body });
  return data!;
}

/** DELETE /products/{id} — Delete product */
export async function deleteProduct(id: string) {
  await coreClient().DELETE('/products/{id}', { params: { path: { id } } });
}

/** POST /products/sync — Push catalog to platforms */
export async function syncProducts(params?: SyncProductsQuery) {
  const { data } = await coreClient().POST('/products/sync', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}
