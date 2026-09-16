import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { productsKeys } from './queries';
import { createProduct, updateProduct, deleteProduct, syncProducts } from './service';

export const createProductMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...productsKeys.all, 'create_product'],
    mutationFn: ({ body }: { body: Parameters<typeof createProduct>[0] }) => createProduct(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKeys.all })
  });

export const updateProductMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...productsKeys.all, 'update_product'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKeys.all })
  });

export const deleteProductMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...productsKeys.all, 'delete_product'],
    mutationFn: ({ id }: { id: string }) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKeys.all })
  });

export const syncProductsMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...productsKeys.all, 'sync_products'],
    mutationFn: ({ params }: { params?: Parameters<typeof syncProducts>[0] }) =>
      syncProducts(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKeys.all })
  });
