// Confere a direção das dependências entre as camadas do site (veja docs/ARQUITETURA.md):
//   features → shared → core → engine     (content: só dados; engine: TypeScript puro, sem Angular)
//   npm run lint:arch
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(fileURLToPath(new URL('../src/app', import.meta.url)));

/** quem cada camada pode importar (além dela mesma) */
const ALLOWED = {
  engine: [],
  content: ['engine'],
  core: ['engine', 'content'],
  shared: ['core', 'engine', 'content'],
  features: ['features', 'shared', 'core', 'engine', 'content'],
};
/** pacotes proibidos por camada */
const FORBIDDEN_PACKAGES = { engine: [/^@angular\//], content: [/^@angular\//] };

const layerOf = (file) => {
  const first = relative(app, file).split(sep)[0];
  return first in ALLOWED ? first : null;
};

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.ts')) yield p;
  }
}

const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
const problems = [];
for await (const file of walk(app)) {
  const from = layerOf(file);
  if (!from) continue; // app.ts, app.config*.ts: a composição pode tudo
  const text = await readFile(file, 'utf8');
  for (const m of text.matchAll(IMPORT)) {
    const spec = m[1] ?? m[2];
    const where = relative(app, file).replaceAll(sep, '/');
    if (!spec.startsWith('.')) {
      if ((FORBIDDEN_PACKAGES[from] ?? []).some((re) => re.test(spec))) problems.push(`${where}: ${from} não pode usar ${spec}`);
      continue;
    }
    const target = resolve(dirname(file), spec);
    if (!target.startsWith(app)) continue; // environments, testing
    const to = layerOf(target);
    if (to && to !== from && !ALLOWED[from].includes(to)) problems.push(`${where}: ${from} não pode importar ${to} (${spec})`);
  }
}

if (problems.length) {
  console.error(`Dependências fora da arquitetura (${problems.length}):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log('ok  camadas: features → shared → core → engine, sem dependências ao contrário');
