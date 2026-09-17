/**
 * @lp/contracts — TypeScript view of the core-api OpenAPI contract.
 *
 * Everything here is generated from `openapi/core-api.yaml` (`pnpm gen`).
 * Feature `api/types.ts` files in the web app re-export from this module and
 * never declare DTOs by hand (SDD-01 §5.1).
 */
export type { paths, components, operations } from './generated/core-api';
import type { components, operations } from './generated/core-api';

export type Schemas = components['schemas'];
export type Schema<K extends keyof Schemas> = Schemas[K];

/** JSON body of the 2xx response of an operation. */
export type OperationResponse<
  Op extends keyof operations,
  Code extends keyof operations[Op]['responses'] = 200 extends keyof operations[Op]['responses']
    ? 200
    : 201 extends keyof operations[Op]['responses']
      ? 201
      : keyof operations[Op]['responses']
> = operations[Op]['responses'][Code] extends { content: { 'application/json': infer T } } ? T : never;

/** Query parameters of an operation. */
export type OperationQuery<Op extends keyof operations> = operations[Op]['parameters'] extends {
  query?: infer Q;
}
  ? NonNullable<Q>
  : never;

/** JSON request body of an operation. */
export type OperationBody<Op extends keyof operations> = operations[Op]['requestBody'] extends {
  content: { 'application/json': infer T };
}
  ? T
  : never;

export type PageResponse<T> = { items: T[]; meta: Schemas['PageMeta'] };
export type CursorResponse<T> = { items: T[]; meta: Schemas['CursorMeta'] };
export type ListResponse<T> = { items: T[] };

// ── inter-service contracts (SDD-00 §6–7, SDD-05 §4) ────────────────────────
export * from './events';
export * from './jobs';
export * from './spi';
