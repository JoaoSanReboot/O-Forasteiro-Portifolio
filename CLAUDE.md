# Contexto do Projeto

Um portfólio com a temática do velho oeste brasileiro (sertão e cangaço) num design editorial moderno, sem pixel art.
Site em Angular 22 (`frontend/`, standalone, zoneless, Signals, TS strict, prerender estático) e API .NET 10 (`api/`, Minimal API).

## Rodar localmente

```bash
cd frontend && npm ci && npm start      # http://localhost:4200
dotnet run --project api                # http://localhost:5080
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
| `frontend/src/app/engine/` | TypeScript puro, sem Angular: quadros seguros para SSR (`raf`/`cancelRaf`), matemática e as regras do jogo da memória |
| `frontend/src/app/core/` | Infraestrutura: plataforma e o estado da rolagem (`ScrollState`) |
| `frontend/src/app/shared/` | `reveal` (entrada ao rolar), `section-head`, `split` (letras), `ornaments` (SVGs do sertão: estrela, sol, mandacaru, chapéu, céu, bandeirinhas e o feno) e `emblems` (o desenho animado de cada título) |
| `frontend/src/app/features/` | `intro` (abertura), `site` (casca só de rolagem, sem barra; rodapé, Lenis), `hero` e as seções `sobre`, `projetos`, `experiencia`, `skills`, `commits` (GitHub), `formacao`, `contato`; os jogos moram dentro das seções: `duelo` (na Experiência), `memoria` (nas Skills) e as moedas de `secrets` |
| `frontend/src/app/content/` | Textos e dados (perfil, experiência, formação, contatos, projetos, skills, jogos, registro guardado do GitHub) |
| `frontend/src/styles/` | Tokens, base, movimento e uma parte por seção |
| `frontend/src/environments/` | `githubEndpoint`, `skipIntro` |
| `api/` | `Program.cs` compõe; `Infrastructure/` (CORS); `Features/GitHub/` (`GET /api/github/contributions`: serviço, endpoint, cliente GraphQL) e `Features/Health/` |
| `.github/workflows/` | CI em PR; deploy na main (Static Web Apps + App Service) |
| `docs/` | Arquitetura e integração com o GitHub |

Dependências só num sentido: `features → shared → core → engine` (`content` é só dado). `npm run lint:arch` confere.

## Convenções

- Textos da interface e comentários em português do Brasil.
- Visual terroso e texturizado (chão de barro queimado com pintas e manchas em `--textura`, urucum, ocre, couro e mandacaru saturados): cores, fontes e curvas só pelos tokens de `src/styles/_tokens.scss`. Títulos de seção com `<header appSectionHead>`: tipo de madeira (Ultra) com a tinta da prensa (`filter: url(#tinta)`), o fim em itálico serifado e um `emblem` que desenha o título; ornamentos do sertão por `shared/ornaments`. Rye só em rótulos curtos; Sancreek (toscano de cartaz) e Special Elite (máquina de escrever) só em detalhes. Nada de pixel art.
- Movimento: entradas com `appReveal` (+ `revealDelay`), o topo espera `html.ready`, efeitos de rolagem leem `--sy` ou usam `animation-timeline: view()`. Sempre respeitar "reduzir movimento" e deixar o conteúdo visível sem JavaScript (o que esconde para animar depende de `html.js`).
- Estado que muda a cada quadro fica fora dos Signals (estilo ou variável CSS direto no elemento); Signals só para o que a interface mostra.
- O código também roda no Node (prerender e SSR do `ng serve`): nada de `window`, `document` ou armazenamento fora do navegador.
  Animações começam em `afterNextRender`; quadros usam `raf`/`cancelRaf` de `engine/core/browser.ts`; cleanups com `DestroyRef`.
- Manter foco visível nos controles; links externos com `target="_blank" rel="noopener"` e o aviso "(abre em outra aba)".
- Segredos (token do GitHub) nunca no repositório: user-secrets em desenvolvimento, configuração do App Service em produção.
