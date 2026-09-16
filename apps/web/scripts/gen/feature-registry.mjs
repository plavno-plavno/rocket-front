import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { HEADER, importPath, listFeatures, SRC, writeGenerated } from './lib.mjs';

/** Builds src/generated/feature-registry.ts from features/<f>/feature.ts (default export). */
export function generateFeatureRegistry(report) {
  const entries = [];
  for (const id of listFeatures()) {
    const file = join(SRC, 'features', id, 'feature.ts');
    if (existsSync(file)) entries.push({ id, file });
  }
  const ident = (s) => s.replace(/[^a-zA-Z0-9]/g, '_');
  let out = HEADER + "import type { FeatureDefinition } from '@/shell/feature';\n";
  for (const e of entries) out += `import ${ident(e.id)} from '${importPath(e.file)}';\n`;
  out += '\nexport const features: readonly FeatureDefinition[] = [\n';
  for (const e of entries) out += `  ${ident(e.id)},\n`;
  out += '];\n\nexport const featureIds = [' + entries.map((e) => `'${e.id}'`).join(', ') + '] as const;\n';
  report.outputs.push(writeGenerated('feature-registry.ts', out));
  return entries.map((e) => e.id);
}
