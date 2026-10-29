# Contexto do projeto para o Claude Code

Portfólio em pixel art com temática de velho oeste/cangaço.
Site em Angular 22 (`frontend/`, standalone, zoneless, Signals, TS strict, prerender estático) e API .NET 10 (`api/`, Minimal API).

## Rodar localmente

```bash
cd frontend && npm ci && npm start      # http://localhost:4200 (em desenvolvimento a abertura é pulada: skipIntro)
dotnet run --project api                # http://localhost:5080 (placa do GitHub; token nos user-secrets em GitHub:Token)
```

## Testes e build

```bash
cd frontend && npm test                 # Vitest (jsdom)
cd frontend && npm run test:ssr         # sobe o ng serve e confere que o SSR não quebra
cd frontend && npx ng build             # prerender em frontend/dist/forasteiro/browser
dotnet build Forasteiro.slnx && dotnet test Forasteiro.slnx
```

## Estrutura

| Caminho | O que é |
|---|---|
| `frontend/src/app/engine/` | Pixel art em TS puro: canvas, primitivas, figuras, cenas, elenco (`HEROES`, `drawHero`), áudio (`createVilaAudio`), segredos, jogo da velha |
| `frontend/src/app/core/` | Serviços: plataforma, armazenamento, progresso/segredos, abertura, áudio, herói, duelo, guia, laço das cenas |
| `frontend/src/app/intro/` | Tela inicial, cavalgada (`ride.ts`) e alto-falante |
| `frontend/src/app/site/` | As seções (mural, skills, projetos, trabalhos, commits, formação, saloon, duelo) e o xerife guia |
| `frontend/src/app/shared/scene-canvas.ts` | Componente que monta uma cena do engine num `<canvas>` |
| `frontend/src/app/content/` | Textos e dados (projetos, skills, registro guardado da placa) |
| `frontend/src/styles/` | CSS global, por seção |
| `frontend/src/environments/` | `githubEndpoint`, `duelMusicUrl`, `skipIntro` |
| `api/Features/GitHub/` | `GET /api/github/contributions` (GraphQL do GitHub, cache de 1 h) |
| `.github/workflows/` | CI em PR; deploy na main (Static Web Apps + App Service) |
| `docs/` | Integração com o GitHub e origem/licença das trilhas |

## Convenções

- Textos da interface e comentários em português do Brasil.
- Pixel art desenhada em código: cenas em canvas 320 × 150 (`SW`/`SH`), ampliadas em escala inteira; helpers `R`, `O`, `disc`, `limb`, `head`, `torso`, `pixelText`, `tinyText`.
- Estado que muda a cada quadro fica em objetos comuns; Signals só para o que a interface mostra.
- O código também roda no Node (prerender e SSR do `ng serve`): nada de `window`, `document`, armazenamento, áudio ou canvas fora do navegador.
  Animações começam em `afterNextRender`; quadros usam `raf`/`cancelRaf` de `engine/core/browser.ts`; cleanups no construtor só com `PlatformService.isBrowser`.
- Respeitar `prefers-reduced-motion` e manter foco visível nos controles.
- Segredos (token do GitHub) nunca no repositório: user-secrets em desenvolvimento, configuração do App Service em produção.

## Ganchos de depuração (build de desenvolvimento)

`vilaSeek(cena, t)`, `vilaTime(cena)` e `VilaAudio.state` no console.
