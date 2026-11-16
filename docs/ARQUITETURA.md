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
| `engine/` | Utilitários em TypeScript puro, sem Angular: quadros seguros para SSR (`core/browser.ts`), matemática (`core/math.ts`) e as regras do jogo da memória (`games/memory.ts`) | só o próprio engine |
| `content/` | Textos e dados do portfólio: perfil, experiência, formação e contatos (`profile.ts`), projetos, skills e o registro guardado do GitHub | `engine` (tipos) |
| `core/` | Infraestrutura sem regra de negócio: `platform/` (navegador, "reduzir movimento", mouse) e `scroll/` (o estado da rolagem: `--sy`, `--progress`, barra escondida) | `engine`, `content` |
| `shared/` | Peças reaproveitadas: `reveal/` (entrada ao rolar), `section-head/` (cabeçalho numerado), `split/` (texto letra por letra), `ornaments/` (estrela de couro, sol, mandacaru, chapéu, o céu com o Cruzeiro do Sul e as bandeirinhas, em SVG) e `emblems/` (o desenho animado de cada título) | `core`, `engine`, `content` |
| `features/` | Uma pasta por funcionalidade | tudo acima (e outras features pelo serviço público delas) |

`app.ts` e `app.config*.ts` só compõem a aplicação. A regra é conferida por `npm run lint:arch`, que também roda no CI.

### Onde está cada coisa

| Funcionalidade | Pasta | Peças |
|---|---|---|
| Abertura | `features/intro/` | `intro.ts` (tela de carregamento sem pular: sol, mandacarus, "Seja bem-vindo, Forasteiro" letra por letra, contador com o tambor e a cortina), `intro.service.ts` (`showing`/`done`, "Rever a abertura"; põe `intro-on` e `ready` no `<html>`) |
| Site (casca) | `features/site/` | `site.ts` (ordem das seções, `inert` sob a abertura, liga o `ScrollState` e a inércia), `site-nav/` (barra, seção atual, menu de tela cheia no celular), `site-footer/`, `smooth-scroll.ts` (Lenis, num pedaço à parte) |
| Topo | `features/hero/` | nome enorme em tipo de madeira, o cartaz de "Procura-se" com o retrato e o carimbo, sol com parallax e urubus, e o horizonte (chão, mandacarus e cerca) |
| Seções | `features/<id>/` | `sobre` (frase que acende pela rolagem e os números), `projetos` (índice com prévia seguindo o cursor), `experiencia` (ficha presa e entregas), `skills` (fichas por categoria), `formacao` (régua de anos), `contato` (e-mail com copiar e os perfis) |
| Jogos | `features/duelo/`, `memoria/`, `secrets/` e `content/jogos.ts` | Moram dentro das seções e usam os dados do portfólio. `duelo/` fica no fim da Experiência: o palco em SVG e, em `rules/`, a caçada aos bandidos (os problemas resolvidos), as faixas, o ritmo e a mecânica de cada arma, sem DOM. `memoria/` fica no fim das Skills: ferramenta e onde ela trabalhou. `secrets/` cuida das moedas escondidas, cada uma com um causo: o aviso, o bolso na barra e o progresso no `localStorage`, lido só depois da hidratação |
| GitHub | `features/commits/` | `commits.ts` (grade e varredura), `github-heat.source.ts` (acesso à API), `github-endpoint.ts` |
| Estilos | `src/styles/` | `_tokens.scss` (cores, fontes, curvas), `_base.scss`, `_motion.scss` (entradas e keyframes), uma parte por seção |

### Padrões

- **Sistema visual ("caatinga ao meio-dia").** Papel de cordel, tinta de xilogravura, urucum, sol, mandacaru e couro, em `src/styles/_tokens.scss`. Títulos em tipo de madeira de cartaz (Ultra) com a tinta falhada da prensa (o filtro SVG `#tinta`, no `site.ts`), terminando em Instrument Serif itálico; letreiro de cartaz (Rye) só em rótulos curtos; o toscano de "Procura-se" (Sancreek) no cartaz e nos números de seção; a máquina de escrever das fichas da volante (Special Elite) em datas, fichas e carimbos; texto em Bricolage Grotesque; rótulos em JetBrains Mono. As seções escuras têm a borda em dente de serra (a barra de couro do chapéu de cangaceiro), o bordado de cangaceiro (`.bordado`: signo de Salomão e losangos, só CSS) marca as Skills e o rodapé, o progresso da leitura é uma cartucheira e um grão de papel cobre a página. As seções claras ganham cor na rolagem: cada uma tem a sua paleta (`--wash-1`/`--wash-2`) em manchas que escorregam e um ornamento gigante em cor atrás do texto, tudo animado pela linha do tempo da rolagem (`animation-timeline: view()`, só CSS em `_sections.scss`).
- **Recarregar volta ao topo.** O `index.html` desliga a restauração de rolagem do navegador e tira a âncora do endereço antes de a página pular até ela: todo recarregamento começa na abertura e no topo que apresenta o João.
- **Emblemas dos títulos.** Cada `<header appSectionHead>` recebe `emblem` e ganha o desenho que conta o título: chapéu tirado no cumprimento (sobre), ferro de marcar em brasa (projetos), pegadas andando (experiência), peixeiras cruzadas (skills), sinal correndo no fio do telégrafo (GitHub), candeeiro (formação) e fogueira (contato). O movimento começa quando o cabeçalho entra na tela (`styles/_emblems.scss`).
- **Movimento.** Entradas por `appReveal` (`up`, `mask`, `line`), escalonadas com `revealDelay`. O topo entra depois da abertura (`html.ready`). Rolagem com inércia pelo Lenis. Efeitos ligados à rolagem leem `--sy`/`--progress` (ScrollState) ou usam `animation-timeline: view()` onde existe. Tudo respeita "reduzir movimento".
- **Sem JavaScript, tudo aparece.** O prerender sai com o site inteiro; o que fica escondido para animar depende de `html.js` (posto por um script no `index.html`), e a abertura sai da frente sozinha pelo CSS.
- **O código também roda no Node** (prerender e SSR do `ng serve`): nada de `window`, `document` ou armazenamento fora do navegador. Animações começam em `afterNextRender`; quadros usam `raf`/`cancelRaf` de `engine/core/browser.ts`.
- **Componentes pelo atributo.** As seções usam seletores de atributo (`section[appProjetos]`, `header[appSectionHead]`).

### Nova seção, passo a passo

1. Crie `features/<id>/<id>.ts` com o seletor `section[app<Nome>]`, `class: 'sec'` e o `id` da seção no `host`, e use `<header appSectionHead>` (com um `emblem` de `shared/emblems`, ou um novo desenho lá).
2. Coloque os textos em `content/`, a seção em `features/site/site.ts` (e o link em `site-nav/`) e o CSS em `src/styles/_<id>.scss` (importado em `styles.scss`).
3. Rode `npm test`, `npm run lint:arch` e `npm run test:ssr`.

## API (`api/`)

Fatias verticais por funcionalidade (`Features/<Nome>/`) e infraestrutura compartilhada em `Infrastructure/`.

| Arquivo | Responsabilidade |
|---|---|
| `Program.cs` | Só compõe: CORS, serviços e rotas |
| `Infrastructure/Cors/FrontendCors.cs` | CORS liberado só para o frontend |
| `Features/Health/HealthEndpoints.cs` | `GET /api/health` |
| `Features/GitHub/GitHubServiceCollectionExtensions.cs` | Registro de DI da placa |
| `Features/GitHub/ContributionsService.cs` | A regra: token, cache de 1 h, chamada ao GitHub e conversão dos dias; devolve um `ContributionsOutcome`, sem HTTP |
| `Features/GitHub/ContributionsEndpoints.cs` | Traduz o resultado para status e corpo HTTP |
| `Features/GitHub/GitHubClient.cs` + `GraphQlModels.cs` | Acesso à API GraphQL do GitHub |
| `Features/GitHub/ContributionsContracts.cs`, `ContributionLevels.cs`, `GitHubOptions.cs` | Contratos de resposta, tons da placa e configuração |
