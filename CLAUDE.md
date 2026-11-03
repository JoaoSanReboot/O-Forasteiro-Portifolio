# Contexto do Projeto

Um Portfólio com estilo de pixel art com temática de velho oeste/cangaço.
Site em Angular 22 (`frontend/`, standalone, zoneless, Signals, TS strict, prerender estático) e backend .NET 10 (`backend/`, Minimal API).

## Rodar localmente

```bash
cd frontend && npm ci && npm start      # http://localhost:4200
dotnet run --project backend            # http://localhost:5080 (GITHUB_TOKEN no .env da raiz)
```

## Testes e build

```bash
cd frontend && npm test                 # Vitest (jsdom)
cd frontend && npm run test:ssr         # sobe o ng serve e confere que o SSR não quebra
cd frontend && npm run lint:arch        # a direção das dependências entre as camadas
cd frontend && npx ng build             # prerender em frontend/dist/forasteiro/browser
dotnet build Forasteiro.slnx
```

## Estrutura

O mapa completo (camadas, onde cada funcionalidade mora, padrões) está em `docs/ARQUITETURA.md`.

| Caminho | O que é |
|---|---|
| `frontend/src/app/engine/` | Pixel art em TS puro, sem Angular: canvas, primitivas, figuras, cenas, elenco e sprite (`heroes/`), áudio (`audio/`), segredos, jogo da velha |
| `frontend/src/app/core/` | Infraestrutura: plataforma, armazenamento, áudio e o laço das cenas com os contratos `SCENES_ACTIVE`/`SCENE_HOST` |
| `frontend/src/app/shared/` | `scene-canvas`: o componente que monta uma cena do engine num `<canvas>` |
| `frontend/src/app/features/` | Uma pasta por funcionalidade: `intro` (abertura, `gate`, `ride/`), `site`, `secrets`, `guide`, `heroes` e as seções `mural`, `projetos`, `trabalhos`, `skills`, `commits`, `formacao`, `saloon`, `duelo` (regras em `duelo/rules/`) |
| `frontend/src/app/content/` | Textos e dados (projetos, skills, registro guardado da placa) |
| `frontend/src/styles/` | CSS global, por seção |
| `frontend/src/environments/` | `githubEndpoint`, `duelMusicUrl`, `skipIntro` |
| `backend/` | `Program.cs` (`.env`, CORS) e `GitHubContributions.cs` (`GET /api/github/contributions`, a única integração) |
| `.github/workflows/` | CI em PR; deploy na main (Static Web Apps + App Service) |
| `docs/` | Arquitetura, integração com o GitHub e origem/licença das trilhas |

Dependências só num sentido: `features → shared → core → engine` (`content` é só dado). `npm run lint:arch` confere.

## Convenções

- Textos da interface e comentários em português do Brasil.
- Pixel art desenhada em código: cenas em canvas 320 × 150 (`SW`/`SH`), ampliadas em escala inteira; helpers `R`, `O`, `disc`, `limb`, `head`, `torso`, `pixelText`, `tinyText`.
- Estado que muda a cada quadro fica em objetos comuns; Signals só para o que a interface mostra.
- O código também roda no Node (prerender e SSR do `ng serve`): nada de `window`, `document`, armazenamento, áudio ou canvas fora do navegador.
  Animações começam em `afterNextRender`; quadros usam `raf`/`cancelRaf` de `engine/core/browser.ts`; cleanups no construtor só com `PlatformService.isBrowser`.
- Respeitar `prefers-reduced-motion` e manter foco visível nos controles.
- Segredos (token do GitHub) nunca no repositório: `.env` na raiz em desenvolvimento (no `.gitignore`), configuração do App Service em produção.

## Ganchos de depuração (build de desenvolvimento)

`vilaSeek(cena, t)`, `vilaTime(cena)` e `VilaAudio.state` no console.
