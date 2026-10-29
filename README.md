# Em Busca do Forasteiro — portfólio de João Pedro

Portfólio em pixel art com temática de velho oeste/cangaço.

## Stack: `frontend/` (Angular 22) e `api/` (.NET 10)

Requisitos: .NET SDK 10 (veja `global.json`) e Node 22.22+ ou 24.15+.

```bash
# API em http://localhost:5080 (serve a placa do GitHub em /api/github/contributions)
dotnet user-secrets set "GitHub:Token" "<seu token>" --project api   # uma vez; sem token a placa responde 503
dotnet run --project api

# site em http://localhost:4200 (em desenvolvimento a placa já aponta para a API local)
cd frontend
npm ci
npm start
```

O token **não** fica em nenhum arquivo do repositório: em desenvolvimento vai nos user-secrets (`UserSecretsId` = `forasteiro-api`),
em produção na configuração do App Service. Detalhes do endpoint, das chaves e do comportamento da placa em `docs/INTEGRACAO-GITHUB.md`.

Testes e build:

```bash
dotnet build Forasteiro.slnx && dotnet test Forasteiro.slnx   # na raiz
cd frontend && npm test && npm run test:ssr && npx ng build    # site estático em frontend/dist/forasteiro/browser
```

### CI e deploy (GitHub Actions)

- `.github/workflows/ci.yml`: build e testes da API e do site em todo PR e push fora da main.
- `.github/workflows/deploy.yml`: na main (ou manualmente), roda o CI e publica o site no **Azure Static Web Apps**
  (com `frontend/staticwebapp.config.json`) e a API no **Azure App Service**.

O que configurar no GitHub (Settings → Secrets and variables → Actions):

| Tipo | Nome | Onde pegar |
|---|---|---|
| Secret | `AZURE_STATIC_WEB_APPS_API_TOKEN` | Static Web App → Manage deployment token |
| Secret | `AZURE_WEBAPP_PUBLISH_PROFILE` | App Service → Download publish profile |
| Variable | `AZURE_WEBAPP_NAME` | nome do App Service da API |

E no App Service (Environment variables): `GitHub__Token`, `Cors__AllowedOrigins__0` (URL do site) e, se quiser, `GitHub__Login`.
Para a placa usar a API publicada, troque `githubEndpoint` em `frontend/src/environments/environment.ts` pela URL dela.

## Configuração do site

Em `frontend/src/environments/` (`environment.ts` em produção, `environment.development.ts` no `npm start`):

| Campo | O que faz |
|---|---|
| `githubEndpoint` | URL da API da placa do GitHub; `null` mostra o registro guardado |
| `duelMusicUrl` | faixa licenciada para o duelo; `null` mantém a trilha sintetizada (veja `docs/AUDIO-LICENCAS.md`) |
| `skipIntro` | pula a abertura e entra direto no mural (ligado só em desenvolvimento) |

## Persistência

Moedas, revólver, segredo do Saloon, personagem escolhido, som e recordes do duelo ficam no `localStorage`
(chaves `vila-*`); quem já chegou na visita fica no `sessionStorage` (`vila-chegou`) e pula a cavalgada.

## Ganchos de depuração (build de desenvolvimento)

`vilaSeek(cena, t)`, `vilaTime(cena)` e `VilaAudio.state` no console.
