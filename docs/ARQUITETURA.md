# Arquitetura

Como o código está organizado, quem pode depender de quem e onde cada funcionalidade mora.

## Site (`frontend/src/app`)

### Camadas

```
features  →  shared  →  core  →  engine
   └──────────→ content (dados) ←──┘
```

| Camada | O que tem | Pode importar |
|---|---|---|
| `engine/` | Pixel art em TypeScript puro: canvas, primitivas, figuras, cenas, áudio, jogos. **Não conhece o Angular.** | só o próprio engine |
| `content/` | Textos e dados do portfólio (projetos, skills, registro guardado da placa) | `engine` (tipos) |
| `core/` | Infraestrutura sem regra de negócio: plataforma, armazenamento, áudio, o laço único das cenas e os contratos que elas usam | `engine`, `content` |
| `shared/` | Componentes reaproveitados por várias seções (`scene-canvas`) | `core`, `engine`, `content` |
| `features/` | Uma pasta por funcionalidade, com o componente, o estado e as regras dela | tudo acima (e outras features pelo serviço público delas) |

`app.ts` e `app.config*.ts` só compõem a aplicação. A regra é conferida por `npm run lint:arch`, que também roda no CI.

### Onde está cada coisa

| Funcionalidade | Pasta | Peças |
|---|---|---|
| Abertura | `features/intro/` | `intro.ts` (orquestra), `intro.service.ts` (site aberto, chegada, "Rever a chegada"), `gate/` (tela inicial e escolha do personagem), `ride/` (cavalgada) |
| Cavalgada | `features/intro/ride/` | `ride.ts` (laço e fases), `timeline.ts`, `tale.ts` (narração), `palette.ts`, `sprites.ts`, `stage.ts` (palco e projeção), `landscape.ts`, `roadside.ts`, `particles.ts`, `arrival.ts` (porteira), `poster.ts` (cartaz) |
| Personagem escolhido | `features/heroes/` | `hero.service.ts`; o elenco e o desenho ficam em `engine/heroes/` |
| Site (casca) | `features/site/` | `site.ts` (ordem das seções e chegada no mural), `site-footer/`, `scene-host.ts` (liga as cenas ao resto) |
| Segredos | `features/secrets/` | `secrets.service.ts` (moedas, revólver, segredo do Saloon, progresso no navegador), `secrets-lines.ts` (falas), `secrets-hud/` (contador) |
| Xerife | `features/guide/` | `guide.service.ts` (o balão), `guide.ts` (botão e área atual), `guide-tips.ts` (falas por área); o desenho em `engine/figures/sheriff.ts` |
| Mural, Projetos, Trabalhos, Skills, Formação | `features/<seção>/` | um componente cada (a pasta tem o id da seção) |
| Commits | `features/commits/` | `commits.ts` (placa e varredura), `github-heat.source.ts` (acesso à API), `github-endpoint.ts` |
| Saloon | `features/saloon/` | `saloon.ts` (cena e convite), `saloon.service.ts` (estado da cena), `candle-secret.ts` (segredo da vela), `tic-tac-toe/`, `drinks-menu/` (contatos) |
| Duelo | `features/duelo/` | `duelo.ts` (interface, cena, som e relógio), `duel.service.ts` (estado da cena), `duel-records.service.ts` (vitórias), `rules/` (regras puras) |
| Regras do duelo | `features/duelo/rules/` | `levels.ts`, `kit.ts` (falas de cada arma), `zones.ts` (faixas e julgamento), `mechanics.ts` (a mecânica de cada arma), `match.ts` (placar e sorteio do sino) |
| Cenas em canvas | `engine/scenes/` | uma cena por arquivo (`armeiro.ts`, `ferraria.ts`...), registradas em `index.ts`; figuras reaproveitadas em `engine/figures/` |
| Trilha e efeitos | `engine/audio/` | `vila-audio.ts` (orquestração), `rig.ts` (mesa de som), `instruments.ts`, `notes.ts`, `tracks.ts`, `effects.ts` |

### Padrões

- **Estado quadro a quadro em objetos comuns, Signals só para a interface.** As cenas leem objetos simples a cada quadro (`DuelState`, `PianoState`); o que a página mostra são Signals.
- **As cenas não conhecem as features.** O `SceneCanvas` e o `SceneLoopService` dependem só dos contratos `SCENES_ACTIVE` e `SCENE_HOST` (`core/scene/scene-host.ts`); quem os implementa é o site (`features/site/scene-host.ts`, registrado em `app.config.ts` e nos provedores dos testes).
- **Regras sem DOM.** As regras do duelo falam com a tela, a cena e o som por uma porta (`DuelPort`); cada arma é uma estratégia (`Mechanic`). Isso deixa as regras testáveis sem navegador.
- **O código também roda no Node** (prerender e SSR do `ng serve`): nada de `window`, `document`, armazenamento, áudio ou canvas fora do navegador. Animações começam em `afterNextRender`; quadros usam `raf`/`cancelRaf` de `engine/core/browser.ts`.
- **Componentes pelo atributo.** As seções usam seletores de atributo (`section[appDuelo]`, `div[appTicTacToe]`) para manter o HTML e o CSS de sempre.

### Nova seção, passo a passo

1. Crie `features/<id>/<id>.ts` (e `.html`) com o seletor `section[app<Nome>]` e o `id` da seção no `host`.
2. Se tiver cena, crie `engine/scenes/<id>.ts` e registre em `engine/scenes/index.ts`; use `<figure appScene="<id>">` no template.
3. Coloque a seção em `features/site/site.ts`, na ordem certa, e o CSS em `src/styles/site/`.
4. Rode `npm test`, `npm run lint:arch` e `npm run test:ssr`.

## Backend (`backend/`)

Uma única integração, a placa do GitHub, em dois arquivos.

| Arquivo | Responsabilidade |
|---|---|
| `Program.cs` | Lê o `.env` em desenvolvimento, configura o CORS (só o frontend) e registra a placa |
| `GitHubContributions.cs` | `GET /api/github/contributions`: token, cache de 1 h, consulta GraphQL ao GitHub, conversão dos dias e os erros |
