// Teste de fumaça do SSR: sobe o ng serve de verdade, pede a página e confere que o servidor
// renderiza e destrói o app sem cair (nada de window, document, requestAnimationFrame... no Node).
// O prerender do ng build engole erros do destroy; o ng serve, não: por isso o teste é por ele.
//
//   npm run test:ssr                 (desenvolvimento e produção)
//   node scripts/ssr-smoke.mjs production
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const ng = createRequire(import.meta.url).resolve('@angular/cli/bin/ng.js');
const configs = process.argv.slice(2).length ? process.argv.slice(2) : ['development', 'production'];
const ERROR = /\b(ReferenceError|TypeError|RangeError|Error:)|ERROR\b|is not defined/;

async function smoke(config, port) {
  const child = spawn(process.execPath, [ng, 'serve', '--configuration', config, '--port', String(port), '--no-hmr', '--no-open'], {
    cwd: root, env: { ...process.env, NG_CLI_ANALYTICS: 'false', NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  let log = '', exited = null;
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  child.on('exit', (code) => { exited = code ?? 'sinal'; });
  const fail = (why) => { throw new Error(`[${config}] ${why}\n--- saída do ng serve ---\n${log}`); };
  try {
    const t0 = Date.now();
    while (!/localhost:\d+/.test(log)) {
      if (exited !== null) fail(`o ng serve saiu antes de subir (código ${exited})`);
      if (Date.now() - t0 > 120_000) fail('o ng serve não subiu em 2 min');
      await new Promise((r) => setTimeout(r, 250));
    }
    // duas visitas: a segunda pega o que a primeira deixou ao ser destruída
    for (let i = 0; i < 2; i++) {
      const res = await fetch(`http://localhost:${port}/`).catch((e) => fail(`a página não respondeu: ${e.message}`));
      const html = await res.text();
      if (res.status !== 200) fail(`status ${res.status}`);
      if (!html.includes('id="duelo"') || !html.includes('Forasteiro')) fail('o HTML veio sem o conteúdo do site (renderização no cliente?)');
    }
    // o destroy do app no servidor acontece depois da resposta: dá um tempo para o erro aparecer
    await new Promise((r) => setTimeout(r, 2000));
    if (exited !== null) fail(`o ng serve caiu (código ${exited})`);
    const bad = log.split('\n').find((l) => ERROR.test(l));
    if (bad) fail(`erro no SSR: ${bad.trim()}`);
    console.log(`ok  ng serve --configuration ${config}: SSR renderizou e destruiu o app sem erro`);
  } finally {
    child.kill();
  }
}

let port = 4310;
for (const c of configs) await smoke(c, port++);
