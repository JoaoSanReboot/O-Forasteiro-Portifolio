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
cd frontend && npm run lint:arch        # a direção das dependências entre as camadas
cd frontend && npx ng build             # prerender em frontend/dist/forasteiro/browser
dotnet build Forasteiro.slnx && dotnet test Forasteiro.slnx
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
| `api/` | `Program.cs` compõe; `Infrastructure/` (CORS); `Features/GitHub/` (`GET /api/github/contributions`: serviço, endpoint, cliente GraphQL) e `Features/Health/` |
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
- Segredos (token do GitHub) nunca no repositório: user-secrets em desenvolvimento, configuração do App Service em produção.

## Ganchos de depuração (build de desenvolvimento)

`vilaSeek(cena, t)`, `vilaTime(cena)` e `VilaAudio.state` no console.
