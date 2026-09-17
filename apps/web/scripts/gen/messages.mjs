import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { flattenKeys, HEADER, importPath, listFeatures, readJson, SRC, writeGenerated } from './lib.mjs';

const LOCALES = ['ru', 'be', 'en'];

/**
 * Builds src/generated/messages.ts from src/shell/messages/*.json (top-level namespaces)
 * and src/features/<f>/messages/*.json (namespace = feature id). Validates that both
 * locales have the same keys and that feature ids do not collide with shell namespaces.
 */
export function generateMessages(report) {
  const sources = [];
  const shellDir = join(SRC, 'shell/messages');
  const shell = {};
  for (const locale of LOCALES) {
    const file = join(shellDir, `${locale}.json`);
    if (!existsSync(file)) {
      report.error(`messages: missing ${file}`);
      continue;
    }
    shell[locale] = readJson(file);
  }
  const shellNamespaces = new Set(Object.keys(shell.ru ?? {}));
  compareLocales(report, 'shell', shell);

  const features = [];
  for (const id of listFeatures()) {
    const dir = join(SRC, 'features', id, 'messages');
    if (!existsSync(dir)) continue;
    const data = {};
    for (const locale of LOCALES) {
      const file = join(dir, `${locale}.json`);
      if (!existsSync(file)) {
        report.error(`messages: feature "${id}" has no ${locale}.json`);
        continue;
      }
      data[locale] = readJson(file);
    }
    if (shellNamespaces.has(id)) report.error(`messages: feature id "${id}" collides with a shell namespace`);
    compareLocales(report, id, data);
    features.push({ id, dir });
  }

  const ident = (s) => s.replace(/[^a-zA-Z0-9]/g, '_');
  let out = HEADER + '/* eslint-disable */\n';
  for (const locale of LOCALES) out += `import shell_${locale} from '${importPath(join(shellDir, locale))}.json';\n`;
  for (const f of features) for (const locale of LOCALES) out += `import ${ident(f.id)}_${locale} from '${importPath(join(f.dir, locale))}.json';\n`;
  out += '\nexport const messages = {\n';
  for (const locale of LOCALES) {
    out += `  ${locale}: {\n    ...shell_${locale},\n`;
    for (const f of features) out += `    '${f.id}': ${ident(f.id)}_${locale},\n`;
    out += '  },\n';
  }
  out += '} as const;\n\nexport type AppMessages = (typeof messages)[\'ru\'];\n';
  report.outputs.push(writeGenerated('messages.ts', out));
  sources.push(...features.map((f) => f.id));
  return sources;
}

function compareLocales(report, scope, data) {
  if (!data.ru || !data.en) return;
  const ru = new Set(flattenKeys(data.ru));
  const en = new Set(flattenKeys(data.en));
  for (const k of ru) if (!en.has(k)) report.error(`messages[${scope}]: key "${k}" exists in ru but not in en`);
  for (const k of en) if (!ru.has(k)) report.error(`messages[${scope}]: key "${k}" exists in en but not in ru`);
}
