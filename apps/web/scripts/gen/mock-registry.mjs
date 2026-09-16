import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { HEADER, importPath, listFeatures, SRC, writeGenerated } from './lib.mjs';

/** Builds src/generated/mock-registry.ts from features/<f>/mocks/handlers.ts (export `handlers`). */
export function generateMockRegistry(report) {
  const entries = [];
  for (const id of listFeatures()) {
    const file = join(SRC, 'features', id, 'mocks', 'handlers.ts');
    if (existsSync(file)) entries.push({ id, file });
  }
  const ident = (s) => s.replace(/[^a-zA-Z0-9]/g, '_');
  let out = HEADER + "import type { HttpHandler } from 'msw';\n";
  for (const e of entries) out += `import { handlers as ${ident(e.id)} } from '${importPath(e.file)}';\n`;
  out += '\nexport const featureHandlers: HttpHandler[] = [\n';
  for (const e of entries) out += `  ...${ident(e.id)},\n`;
  out += '];\n\nexport const mockFeatureIds = [' + entries.map((e) => `'${e.id}'`).join(', ') + '] as const;\n';
  report.outputs.push(writeGenerated('mock-registry.ts', out));
  return entries.map((e) => e.id);
}
