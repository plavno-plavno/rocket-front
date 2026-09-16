import { queryOptions } from '@tanstack/react-query';
import { listProducts, getProduct } from './service';
import type { ListProductsQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const productsKeys = {
  all: ['products'] as const,
  products: (params?: ListProductsQuery) =>
    [...productsKeys.all, 'products', params?.scope ?? 'all', params ?? {}] as const,
  product: (id: string) => [...productsKeys.all, 'product', id] as const
};

export const productsQueryOptions = (params?: ListProductsQuery) =>
  queryOptions({ queryKey: productsKeys.products(params), queryFn: () => listProducts(params) });

export const productQueryOptions = (id: string) =>
  queryOptions({ queryKey: productsKeys.product(id), queryFn: () => getProduct(id) });
