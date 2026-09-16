import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { parse } = require('yaml');

const SPEC = resolve(process.cwd(), '../../packages/contracts/openapi/core-api.yaml');

export function loadSpec() {
  return parse(readFileSync(SPEC, 'utf8'));
}

/** Flattens the OpenAPI paths into operations with resolved parameters. */
export function listOperations(spec) {
  const ops = [];
  const resolveParam = (p) => (p.$ref ? spec.components.parameters[p.$ref.split('/').pop()] : p);
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op || typeof op !== 'object' || !op.operationId) continue;
      const params = (op.parameters ?? []).map(resolveParam);
      ops.push({
        path,
        method: method.toUpperCase(),
        id: op.operationId,
        tags: op.tags ?? [],
        summary: op.summary ?? '',
        pathParams: params.filter((p) => p.in === 'path').map((p) => p.name),
        queryParams: params.filter((p) => p.in === 'query').map((p) => ({ name: p.name, required: !!p.required })),
        hasBody: !!op.requestBody?.content?.['application/json'],
        isStream: !!Object.values(op.responses).some((r) => r?.content?.['text/event-stream'] && !r?.content?.['application/json']),
        isMultipart: !!op.requestBody?.content?.['multipart/form-data'],
        successCode: Object.keys(op.responses).find((c) => c.startsWith('2')) ?? '200',
        responseSchema: schemaRefOf(op.responses),
        bodySchema: op.requestBody?.content?.['application/json']?.schema?.$ref?.split('/').pop() ?? null
      });
    }
  }
  return ops;
}

function schemaRefOf(responses) {
  const ok = Object.entries(responses).find(([c]) => c.startsWith('2'))?.[1];
  const schema = ok?.content?.['application/json']?.schema;
  if (!schema) return null;
  if (schema.$ref) return schema.$ref.split('/').pop();
  const items = schema.properties?.items?.items?.$ref;
  if (items) return items.split('/').pop();
  return null;
}

export function camel(id) {
  return id.replace(/[_-]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}

export function pascal(id) {
  const c = camel(id);
  return c[0].toUpperCase() + c.slice(1);
}
