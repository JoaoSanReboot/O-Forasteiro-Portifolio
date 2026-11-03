# Contexto para a próxima sessão

Complementa o `CLAUDE.md` (como rodar, convenções) e o `docs/ARQUITETURA.md` (mapa completo das camadas). Aqui fica só o estado atual e o que falta.

## Projeto
- Portfólio de João Pedro em pixel art (velho oeste/cangaço).
- **Site:** Angular 22 (standalone, zoneless, Signals, SSG).
- **Backend:** .NET 10 Minimal API em `backend/`, que serve a placa do GitHub.
- **Deploy:** Azure Static Web Apps (site) e App Service (API).
- O protótipo antigo em HTML/JS (`legacy/`) foi migrado e apagado; continua no histórico do git.

## Estado atual
- **PRs:**
  - Migração (fases 1 a 5, PRs #1 a #5) e limpeza do legado (#6): mergeados na main.
  - **PR #7, `refatoracao/arquitetura`:** ainda aberto. O usuário faz o merge. A próxima sessão deve partir dele: confirme se já foi mergeado, e senão trabalhe na branch.
- **Funcionando:**
  - abertura (tela inicial, cavalgada, cartaz);
  - 8 seções com as cenas em canvas;
  - segredos (7 moedas, o revólver, a vela do Saloon);
  - o xerife guia, o jogo da velha e o duelo com 5 armas e 3 níveis;
  - som sintetizado, a placa do GitHub (ao vivo pela API ou com o registro guardado) e o SSR/prerender.
- **Testes:**
  - Site: 62 testes (Vitest), `npm run test:ssr` e `npm run lint:arch`.
  - Backend: sem testes (removidos na limpeza `feature/cleaning-backend`); o CI só faz o build.
  - O CI roda tudo isso em todo PR.

## Arquitetura (resumo)
- **Camadas do site (`frontend/src/app`):** `features → shared → core → engine`, mais `content` (só dados). O `engine` não conhece o Angular. `npm run lint:arch` confere a direção.
- **Uma pasta por funcionalidade em `features/`:**
  - `intro` (com `gate/` e `ride/`), `site`, `secrets`, `guide` e `heroes`;
  - as seções `mural`, `projetos`, `trabalhos`, `skills`, `commits`, `formacao`, `saloon` e `duelo`;
  - as regras puras do duelo ficam em `duelo/rules/`.
- **Contratos das cenas:** as cenas só conhecem `SCENES_ACTIVE`/`SCENE_HOST` (`core/scene/scene-host.ts`), implementados em `features/site/scene-host.ts` e registrados em `app.config.ts` e em `src/testing/providers.ts`.
- **Backend (`backend/`):** só `Program.cs` (`.env`, CORS) e `GitHubContributions.cs` (a placa do GitHub, única integração).

## Decisões a manter
- **Comportamento e visual:** devem continuar idênticos ao atual, salvo pedido explícito do usuário.
- **Estado de cada quadro:** fica em objetos comuns (`DuelState`, `PianoState`). Signals só para o que a interface mostra.
- **SSR:** nada de `window`, `document`, `localStorage`, áudio ou canvas fora do navegador. Usar `afterNextRender`, `raf`/`cancelRaf` (`engine/core/browser.ts`) e `PlatformService.isBrowser` nos cleanups registrados no construtor.
- **Componentes:** usam seletor de atributo (`section[appX]`, `div[appX]`) para manter o HTML e o CSS. As pastas das seções têm o id da âncora (em português); o resto do código é em inglês; os comentários e os textos da interface são em pt-BR.
- **CSS:** global em `src/styles/`, com os seletores herdados do protótipo.
- **Fluxo de trabalho:** o Claude faz build e testes; **o usuário faz todos os commits, PRs e merges**. No fim de cada conversa o Claude sugere o nome do commit e do PR.
- **Token do GitHub:** nunca pedir nem imprimir. Localmente fica no `.env` da raiz (no `.gitignore`), lido pelo backend só em Development (`backend/Program.cs`). Em produção: `GitHub__Token` no App Service.
- **Áudio:** a ordem de criação dos nós e de uso do `Math.random` é compartilhada entre os módulos de áudio e da cavalgada. Reordenar muda o resultado.

## Pendências
1. **Azure:** sem os secrets do repositório, o Deploy falha em todo push na main. Faltam:
   - os secrets `AZURE_STATIC_WEB_APPS_API_TOKEN` e `AZURE_WEBAPP_PUBLISH_PROFILE`;
   - a variable `AZURE_WEBAPP_NAME`;
   - no App Service: `GitHub__Token` e `Cors__AllowedOrigins__0`.
2. **Bug no `deploy.yml`:** a action do Static Web Apps ignora `config_file_location` e `skip_api_build`, então o `staticwebapp.config.json` não seria aplicado. Correção: mover o arquivo para `frontend/public/` e tirar os dois campos.
3. **Endpoint da placa:** com a API publicada, trocar `githubEndpoint` em `frontend/src/environments/environment.ts`.
4. **CI duplicado:** roda duas vezes nas branches com PR (no push e no pull_request).
5. **`frontend/angular.json`:** o Angular CLI grava `"analytics"` localmente. Não commitar; usar `NG_CLI_ANALYTICS=false`.
6. **`.gitignore`:** tem as entradas erradas `.CLAUDE.md` e `.REDME.md` (o usuário disse que corrigiria).
7. **Candidatos para a próxima fase** (ajustes visuais, interface, boas práticas, limpeza):
   - `features/projetos/projetos.ts`: o carrossel mistura a pintura dos baús e as faíscas com a interface;
   - o botão do alto-falante dentro de `intro.html`;
   - as cenas grandes (`engine/scenes/saloon.ts`, `escola.ts`, `delegacia.ts`, com 250 a 300 linhas cada);
   - exports de uso interno (`isoDay`, `COINS`, `GUN_SPOT`);
   - o bundle inicial está em 444 kB (o orçamento avisa em 500 kB).
8. **Teste de regressão visual:** o "golden master" usado na refatoração (puppeteer com relógio virtual, aleatório com semente e áudio gravado; 410 pontos) existe só no scratchpad da sessão anterior. Vale recriá-lo no repositório antes de mexer no visual, para separar as mudanças intencionais das acidentais.
