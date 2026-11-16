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
| `core/` | Infraestrutura sem regra de negócio: `platform/` (navegador, "reduzir movimento", mouse) e `scroll/` (o estado da rolagem: `--sy`) | `engine`, `content` |
| `shared/` | Peças reaproveitadas: `reveal/` (entrada ao rolar), `section-head/` (cabeçalho numerado), `split/` (texto letra por letra), `ornaments/` (estrela de couro, sol, mandacaru, chapéu, o céu com o Cruzeiro do Sul e as bandeirinhas, em SVG) e `emblems/` (o desenho animado de cada título) | `core`, `engine`, `content` |
| `features/` | Uma pasta por funcionalidade | tudo acima (e outras features pelo serviço público delas) |

`app.ts` e `app.config*.ts` só compõem a aplicação. A regra é conferida por `npm run lint:arch`, que também roda no CI.

### Onde está cada coisa

| Funcionalidade | Pasta | Peças |
|---|---|---|
| Abertura | `features/intro/` | `intro.ts` (tela de carregamento sem pular: sol, mandacarus, "Seja bem-vindo, Forasteiro" letra por letra, o tambor do revólver sendo carregado, sem número, e a cortina), `intro.service.ts` (`showing`/`done`, "Rever a abertura"; põe `intro-on` e `ready` no `<html>`) |
| Site (casca) | `features/site/` | `site.ts` (ordem das seções, `inert` sob a abertura, liga o `ScrollState` e a inércia), sem barra no topo (a página é só rolagem), `site-footer/`, `smooth-scroll.ts` (Lenis, num pedaço à parte) |
| Topo | `features/hero/` | nome enorme em tipo de madeira, as duas linhas no mesmo eixo à esquerda, com o pistoleiro em xilogravura de cordel (impresso com a tinta das letras) escorado no "O" de João, que gira o revólver e descarrega o tambor no cartaz (seis buracos de bala, nos tempos de `TIROS`) (sem local nem hora no alto), o título "Desenvolvedor FullStack" menor embaixo dele, em letreiro de saloon (Rye; sem texto de apresentação nem botões), o cartaz de "Procura-se" em papel velho do tamanho de um cartaz (pregado, bordas rasgadas, dobras, "vivo e codando", retrato impresso em sépia, nome e recompensa; as letras seguem a largura do papel e a largura respeita a altura da tela, para o topo caber inteiro com o horizonte), sol com parallax e urubus, e o horizonte (chão, mandacarus e cerca; a altura segue a largura (9vw) para o recorte não cortar a ponta dos mandacarus) |
| Seções | `features/<id>/` | `sobre` (frase que acende pela rolagem e os números), `projetos` (índice com prévia seguindo o cursor), `experiencia` (ficha presa e entregas), `skills` (fichas por categoria), `formacao` (régua de anos), `contato` (e-mail com copiar e os perfis) |
| Jogos | `features/duelo/`, `memoria/`, `secrets/` e `content/jogos.ts` | Moram dentro das seções e usam os dados do portfólio. `duelo/` fica no fim da Experiência: o palco em SVG e, em `rules/`, a caçada aos bandidos (os problemas resolvidos), as faixas, o ritmo e a mecânica de cada arma, sem DOM. `memoria/` fica no fim das Skills: ferramenta e onde ela trabalhou. `secrets/` cuida das moedas escondidas, cada uma com um causo: o aviso, o bolso fixo no canto esquerdo da tela (`coin-purse.ts`) e o progresso no `localStorage`, lido só depois da hidratação |
| GitHub | `features/commits/` | `commits.ts` (grade e varredura), `github-heat.source.ts` (acesso à API), `github-endpoint.ts` |
| Estilos | `src/styles/` | `_tokens.scss` (cores, fontes, curvas), `_base.scss`, `_motion.scss` (entradas e keyframes), uma parte por seção |

### Padrões

- **Sistema visual (terra do sertão).** `--paper` é o chão de barro queimado, `--ink` a escrita cor de areia e `--textura` as pintas e manchas de terra que cobrem as superfícies; urucum, sol, mandacaru e couro, em `src/styles/_tokens.scss`. Títulos em tipo de madeira de cartaz (Ultra) com a tinta falhada da prensa (o filtro SVG `#tinta`, no `site.ts`), terminando em Instrument Serif itálico; letreiro de cartaz (Rye) só em rótulos curtos; o toscano de "Procura-se" (Sancreek) no cartaz e nos números de seção; a máquina de escrever das fichas da volante (Special Elite) em datas, fichas e carimbos; texto em Bricolage Grotesque; rótulos em JetBrains Mono. As seções escuras têm a borda em dente de serra (a barra de couro do chapéu de cangaceiro), o bordado de cangaceiro (`.bordado`: signo de Salomão e losangos, só CSS) marca as Skills e o rodapé, e um grão de papel cobre a página. As seções claras ganham cor na rolagem: cada uma tem a sua paleta (`--wash-1`/`--wash-2`) em manchas que escorregam e um ornamento gigante em cor atrás do texto, tudo animado pela linha do tempo da rolagem (`animation-timeline: view()`, só CSS em `_sections.scss`).
- **Recarregar volta ao topo.** O `index.html` desliga a restauração de rolagem do navegador e tira a âncora do endereço antes de a página pular até ela: todo recarregamento começa na abertura e no topo que apresenta o João.
- **Emblemas dos títulos.** Cada `<header appSectionHead>` recebe `emblem` e ganha o desenho que conta o título: chapéu tirado no cumprimento (sobre), ferro de marcar em brasa (projetos), pegadas andando (experiência), peixeiras cruzadas (skills), sinal correndo no fio do telégrafo (GitHub), candeeiro (formação) e fogueira (contato). O movimento começa quando o cabeçalho entra na tela (`styles/_emblems.scss`).
- **O feno (`shared/ornaments/feno.ts` + `_feno.scss`).** Um emaranhado de galhos sorteado com semente fixa (igual no prerender e no navegador). Quem usa monta o caminho, o pulo (`feno-pulo`: pulos cada vez menores, amassando no chão), o giro (`feno-gira`) e a sombra (`feno-sombra`). No topo ele passa sozinho, com rajadas de vento; na travessia, anda com a rolagem.
- **A travessia (`features/travessia/`).** Logo depois do topo, uma cena do sertão fica presa na tela (sticky) por 320vh de rolagem. O componente põe o progresso em `--p` (0 a 1) a cada quadro e o resto é CSS em `_travessia.scss`: o vaqueiro cruza a cavalo (as patas galopam pela rolagem: animação pausada com atraso negativo vindo de `--p`), um feno o ultrapassa rolando aos pulos, o sol se põe, o céu escurece até o Cruzeiro do Sul, serras, mandacarus e cerca correm em velocidades diferentes, e as três falas (banco de dados → APIs → tela) acendem cada uma no seu trecho. Sem JavaScript ou com "reduzir movimento", a cena fica parada no meio, com as falas juntas.
- **Movimento.** Entradas por `appReveal` (`up`, `mask`, `line`), escalonadas com `revealDelay`. O topo entra depois da abertura (`html.ready`). Rolagem com inércia pelo Lenis. Efeitos ligados à rolagem leem `--sy` (ScrollState) ou usam `animation-timeline: view()` onde existe. Tudo respeita "reduzir movimento".
- **Sem JavaScript, tudo aparece.** O prerender sai com o site inteiro; o que fica escondido para animar depende de `html.js` (posto por um script no `index.html`), e a abertura sai da frente sozinha pelo CSS.
- **O código também roda no Node** (prerender e SSR do `ng serve`): nada de `window`, `document` ou armazenamento fora do navegador. Animações começam em `afterNextRender`; quadros usam `raf`/`cancelRaf` de `engine/core/browser.ts`.
- **Componentes pelo atributo.** As seções usam seletores de atributo (`section[appProjetos]`, `header[appSectionHead]`).

### Nova seção, passo a passo

1. Crie `features/<id>/<id>.ts` com o seletor `section[app<Nome>]`, `class: 'sec'` e o `id` da seção no `host`, e use `<header appSectionHead>` (com um `emblem` de `shared/emblems`, ou um novo desenho lá).
2. Coloque os textos em `content/`, a seção em `features/site/site.ts` e o CSS em `src/styles/_<id>.scss` (importado em `styles.scss`).
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
