# Em Busca do Forasteiro — portfólio de João Pedro

Portfólio com a alma do velho oeste brasileiro (sertão e cangaço) num design editorial moderno.

## Stack: `frontend/` (Angular 22) e `api/` (.NET 10)

Requisitos: .NET SDK 10 (veja `global.json`) e Node 22.22+ ou 24.15+.

```bash
# API em http://localhost:5080 (serve a seção GitHub em /api/github/contributions)
dotnet user-secrets set "GitHub:Token" "<seu token>" --project api   # uma vez; sem token a API responde 503
dotnet run --project api

# site em http://localhost:4200 (em desenvolvimento a seção GitHub já aponta para a API local)
cd frontend
npm ci
npm start
```

O token **não** fica em nenhum arquivo do repositório: em desenvolvimento vai nos user-secrets (`UserSecretsId` = `forasteiro-api`),
em produção na configuração do App Service. Detalhes do endpoint, das chaves e do comportamento da seção GitHub em `docs/INTEGRACAO-GITHUB.md`.

Testes e build:

```bash
dotnet build Forasteiro.slnx && dotnet test Forasteiro.slnx   # na raiz
cd frontend && npm test && npm run lint:arch && npm run test:ssr && npx ng build    # site estático em frontend/dist/forasteiro/browser
```

### Arquitetura

O site é dividido em camadas (`features → shared → core → engine`) e a API em fatias por funcionalidade.
O mapa de onde cada coisa mora, as regras de dependência e os padrões estão em `docs/ARQUITETURA.md`.

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
Para a seção GitHub usar a API publicada, troque `githubEndpoint` em `frontend/src/environments/environment.ts` pela URL dela.

## Configuração do site

Em `frontend/src/environments/` (`environment.ts` em produção, `environment.development.ts` no `npm start`):

| Campo | O que faz |
|---|---|
| `githubEndpoint` | URL da API da seção GitHub; `null` mostra o registro guardado |
| `skipIntro` | pula a abertura e entra direto no site (atalho de desenvolvimento; desligado por padrão) |

## Abertura e movimento

Toda visita e todo recarregamento começam na tela de carregamento ("Seja bem-vindo, Forasteiro", com o tambor do revólver recebendo as balas de 1 a 6, uns 4 segundos) e voltam ao topo da página. Ela não tem botão de pular. "Rever a abertura" fica no rodapé.
Com "reduzir movimento" ligado no sistema, a tela de carregamento aparece sem as animações.

## Jogos dentro das seções

Os jogos contam o próprio portfólio (dados em `src/app/content/jogos.ts`):

- **Duelo ao meio-dia** (fim da Experiência): cada problema que resolvi virou um bandido de cartaz ("Sessenta Segundos", o grid de contratos lento).
  Espere o sino e acerte a faixa da barra (cinco armas; `Espaço` também saca): o bandido vai preso e o cartaz mostra o antes, o depois e como foi. Errou, ele foge e você perde um dos três chapéus.
- **Cordel da memória** (fim das Skills): cada par junta uma ferramenta ao lugar onde ela trabalhou de verdade.
- **Moedas escondidas** pelas seções: cada uma conta um causo meu e, juntas, liberam o revólver aprimorado no duelo.
  O site só guarda no navegador as moedas achadas (`localStorage`, chave `forasteiro-moedas`); "esconder de novo" zera.
