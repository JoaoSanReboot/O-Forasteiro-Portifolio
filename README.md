# Em Busca do Forasteiro — portfólio de João Pedro

Portfólio em pixel art com temática de velho oeste/cangaço.

> **Migração em andamento:** o protótipo original (HTML, CSS e JavaScript puro) está em `legacy/` e está sendo levado para
> `frontend/` (Angular) e `api/` (.NET). A versão nova está resumida logo abaixo; o resto deste README descreve o protótipo.

## Versão nova: `api/` (.NET 10) e `frontend/` (Angular 22)

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
cd frontend && npm test && npx ng build                          # site estático em frontend/dist/forasteiro/browser
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

## Rodar o protótipo (`legacy/`)

```bash
bash legacy/build.sh          # gera legacy/index.html e legacy/forasteiro.html
# abra legacy/index.html no navegador, ou sirva a pasta:
python3 -m http.server 8000 -d legacy   # http://localhost:8000
```

Requisitos do build: `bash`, `base64` e `python3`. As imagens são embutidas no HTML em base64.

**No Windows**, o Python lê os fontes com a codificação padrão do sistema (cp1252) e o build quebra com `UnicodeDecodeError`.
Rode com o Python em modo UTF-8:

```bash
PYTHONUTF8=1 bash legacy/build.sh
```

## Estrutura

| Arquivo (em `legacy/`) | O que é |
|---|---|
| `intro.src.html` | Tela inicial (seleção de personagem), cavalgada, elenco (`HEROES`, `drawHero`), motor de áudio (`VilaAudio`) e alto-falante |
| `site.html` | CSS e marcação das seções do site |
| `site.js` | Cenas em canvas, baús, placa do GitHub, xerife guia, moedas/segredos, segredo do Saloon, jogo da velha e duelo |
| `assets/` | Sprite do cavaleiro, retratos e logos dos projetos (embutidos pelo `build.sh`) |
| `api/github-contributions.js` | Endpoint de servidor (Vercel) para a placa do GitHub ao vivo |
| `docs/` | Integração com o GitHub e origem/licença das trilhas |
| `index.html` / `forasteiro.html` | Gerados pelo build (não edite à mão) |

Os marcadores `__RIDER_PNG__`, `__PORTRAIT_PNG__`, `__POSTER_PNG__` e `__LOGO_*__` nos fontes são trocados pelas imagens no build.

## Configurações opcionais (no site publicado)

```html
<script>
  window.VILA_GH_ENDPOINT = "/api/github-contributions"; // placa do GitHub ao vivo (precisa de GITHUB_TOKEN na Vercel)
  window.VILA_DUEL_MUSIC = "/audio/duelo.mp3";            // faixa licenciada para o duelo (opcional)
</script>
```

Coloque antes do script do site. Detalhes em `docs/INTEGRACAO-GITHUB.md` e `docs/AUDIO-LICENCAS.md`.

## Persistência

Moedas, revólver, segredos, personagem escolhido, som e recordes ficam no `localStorage`.
No protótipo publicado no claude.ai o progresso também era salvo na conta (capacidade `db` do artifact, via `window.claude`);
fora do claude.ai esse caminho simplesmente não existe e o site segue só com o `localStorage`.

## Ganchos de depuração

`vilaSeek(cena, t)`, `vilaTime(cena)`, `vilaPiano()` e `VilaAudio.state` no console.
