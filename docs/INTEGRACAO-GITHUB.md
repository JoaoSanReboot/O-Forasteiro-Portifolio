# Placa do telégrafo: contribuições ao vivo do GitHub

O calendário de contribuições só existe na API GraphQL do GitHub, e ela exige um token.
Por isso a busca acontece na API .NET (`api/Features/GitHub/`), nunca no navegador: o token não sai do servidor.

O endpoint é `GET /api/github/contributions`, e o site o lê de `environment.githubEndpoint`.

## O endpoint

`GET /api/github/contributions` responde:

```json
{ "total": 24, "days": [{ "date": "2026-10-26", "count": 1, "level": 1 }], "fetchedAt": "2026-10-29T12:00:00+00:00" }
```

- `level` vem dos quartis do GitHub: `NONE` → 0, `FIRST_QUARTILE` → 1 … `FOURTH_QUARTILE` → 4; qualquer outro valor → 0.
- A resposta fica 1 h no cache em memória da API e sai com `Cache-Control: s-maxage=3600, stale-while-revalidate=86400`.
- Erros sempre com `{ "error", "details" }`:

| Status | `error` | Quando |
|---|---|---|
| 503 | `missing_token` | a API não tem token configurado |
| 502 | `github_error` | o GitHub respondeu fora de 2xx (ou com um corpo ilegível) |
| 502 | `network_error` | sem conexão com o GitHub (ou estourou o tempo de 15 s) |
| 404 | `no_data` | o GitHub não devolveu calendário (ex.: usuário inexistente); `details` traz os erros dele |

O usuário vem só da configuração (não há `?login=` na URL).

## Configuração da API

| Chave | Alternativa (variável de ambiente) | Obrigatória | Padrão |
|---|---|---|---|
| `GitHub:Token` | `GITHUB_TOKEN` | sim | — |
| `GitHub:Login` | `GITHUB_LOGIN` | não | `JoaoSanReboot` |
| `Cors:AllowedOrigins` | — | sim, em produção | `http://localhost:4200` em desenvolvimento |

O token é um fine-grained token do GitHub (Settings → Developer settings → Fine-grained tokens) só de leitura
a repositórios públicos; nenhuma permissão extra é necessária para ler o calendário público.

**Nunca grave o token em arquivo versionado** (`appsettings*.json`, `environment*.ts`, workflows).

### Desenvolvimento: user-secrets

O projeto `api/` já tem `UserSecretsId` (`forasteiro-api`). Na raiz do repositório:

```bash
dotnet user-secrets set "GitHub:Token" "<seu token>" --project api
dotnet user-secrets list --project api     # confere (mostra o valor só na sua máquina)
```

Os user-secrets só são lidos no ambiente `Development` (o perfil `http` do `launchSettings.json`).

### Produção: Azure App Service

Em App Service → Settings → Environment variables (App settings), crie:

- `GitHub__Token` = o token (no Azure o `:` vira `__`)
- `GitHub__Login` = `JoaoSanReboot` (opcional)
- `Cors__AllowedOrigins__0` = a URL do site no Static Web Apps (ex.: `https://<nome>.azurestaticapps.net`)

## Ligar o site ao endpoint

- Desenvolvimento: `environment.development.ts` já aponta para `http://localhost:5080/api/github/contributions`.
- Produção: `environment.ts` sai com `githubEndpoint: null` (a placa mostra o registro guardado). Depois de publicar a API, troque por `https://<app>.azurewebsites.net/api/github/contributions`
  e faça o deploy de novo. A URL não é segredo; o token continua só no App Service.
- Nos testes (`ng test`) a placa fica desligada por `src/testing/providers.ts`; `commits.spec.ts` liga com um `fetch` falso.

## Como a placa se comporta

A busca só acontece no navegador (o site é prerenderizado com o registro guardado).

- Sem endpoint: mostra o registro de outubro de 2026 e avisa que a integração não está configurada.
- Carregando: "Consultando o GitHub pelo telégrafo...".
- Falha de rede ou da API (qualquer status fora de 2xx): volta para o registro guardado e avisa "Sem sinal do GitHub agora".
- Resposta sem dias: avisa "O GitHub não mandou dados agora" e mantém o registro guardado.
- Sucesso: a grade é refeita com os dias reais (com a contagem de cada dia no clique) e mostra a data da atualização.
