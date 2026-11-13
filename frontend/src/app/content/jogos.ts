// Os jogos contam a história do portfólio: tudo aqui sai da experiência, das skills e dos projetos.

/**
 * Os bandidos do duelo (seção Experiência): cada um é um problema de verdade que eu já resolvi.
 * O apelido é de cangaceiro; o carimbo de "preso" mostra o antes, o depois e como foi.
 */
export interface Bandit {
  /** o apelido no cartaz */
  alias: string;
  /** o problema, em poucas palavras */
  crime: string;
  before: string;
  after: string;
  /** como ele foi preso */
  how: string;
  org: string;
}

export const BANDITS: readonly Bandit[] = [
  { alias: 'Status Trocado', crime: 'cobrança fora de sincronia', before: 'status errado', after: 'em dia', how: 'Webhooks sincronizando o status com a instituição financeira.', org: 'Agile Connect' },
  { alias: 'Sessenta Segundos', crime: 'o grid de contratos', before: '60 s', after: '4 s', how: 'Processamento levado para a camada de query no SQL Server.', org: 'Agile Connect' },
  { alias: 'Dia Inteiro', crime: 'a exportação de notas fiscais', before: '1 dia', after: '2 h', how: 'A regra em LSP de exportação automática otimizada.', org: 'Mydas' },
  { alias: 'Cinco Dias', crime: 'o fechamento mensal do ERP', before: '5 dias', after: '4 h', how: 'Mensageria assíncrona na AWS e boletos gerados a partir das NFs.', org: 'Mydas' },
];

/** O jogo da memória (seção Skills): cada ferramenta e onde ela trabalhou de verdade. */
export interface Pair {
  tool: string;
  where: string;
}

export const PAIRS: readonly Pair[] = [
  { tool: '.NET', where: 'APIs financeiras e workers na Agile Connect' },
  { tool: 'SQL Server', where: 'Grid de contratos de 60 s para 4 s' },
  { tool: 'AWS Lambda', where: 'Fechamento do ERP de 5 dias para 4 h' },
  { tool: 'JasperReports', where: 'Mais de 12 relatórios dinâmicos para clientes' },
  { tool: 'Webhooks', where: 'Status de cobrança sempre em dia' },
  { tool: 'C# Forms', where: 'O totem de pedidos do Ukra' },
];

/** O que cada moeda escondida conta quando é achada. */
export const COIN_FACTS = {
  horizonte: 'Pouso fixo em São José dos Pinhais, no Paraná.',
  couro: 'Claude Code e OpenCode no dia a dia da Agile Connect.',
  candeeiro: 'Técnico pela FIEP e no 4º período de Engenharia de Software.',
  prosa: 'Inglês intermediário, treinado lendo conteúdo em inglês.',
  rodape: 'Este site: Angular 22 na frente e .NET 10 atrás.',
} as const;
