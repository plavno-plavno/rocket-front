/**
 * Runtime access to the OpenAPI document (used by the mock server to build
 * baseline handlers and by tooling). Kept separate from `index.ts` so the
 * type-only entry stays side-effect free.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, OpenApiOperation | unknown>>;
  components: { schemas: Record<string, unknown>; parameters?: Record<string, unknown> };
}

export interface OpenApiOperation {
  operationId: string;
  tags?: string[];
  summary?: string;
  parameters?: unknown[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
}

const SPEC_PATH = fileURLToPath(new URL('../openapi/core-api.yaml', import.meta.url));

export function loadOpenApiDocument(): OpenApiDocument {
  return parse(readFileSync(SPEC_PATH, 'utf8')) as OpenApiDocument;
}

export const OPENAPI_SPEC_PATH = SPEC_PATH;
