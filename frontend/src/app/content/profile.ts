// Quem é o forasteiro: textos do topo, da apresentação, da experiência, da formação e dos contatos.

export const PROFILE = {
  name: 'João Pedro',
  fullName: 'João Pedro Santana Rosa',
  role: 'Desenvolvedor FullStack',
  stack: '.NET',
  location: 'São José dos Pinhais, PR',
  lead: 'Do banco de dados à tela: APIs, integrações e interfaces construídas com cuidado, sem deixar stack trace pelo caminho.',
  portrait: 'assets/retrato-cartaz.png',
} as const;

/**
 * A apresentação, que acende palavra por palavra conforme a página rola.
 * Trechos entre *asteriscos* saem em itálico serifado.
 */
export const STATEMENT =
  'Sou desenvolvedor FullStack com o pé firme no *.NET*. Trabalho *do banco de dados à tela*: APIs, integrações financeiras, ' +
  'relatórios e interfaces. Gosto de pegar o que está lento, travado ou manual e deixar *rápido, assíncrono e automático*.';

/** resultados que já entreguei (vêm da experiência abaixo) */
export const STATS: readonly { value: string; label: string }[] = [
  { value: '60 s → 4 s', label: 'no carregamento do grid de contratos, levando o processamento para a query' },
  { value: '5 dias → 4 h', label: 'no fechamento mensal de um ERP, com mensageria assíncrona na AWS' },
  { value: '12+', label: 'relatórios dinâmicos em JasperReports para clientes industriais e comerciais' },
  { value: '1 dia → 2 h', label: 'na exportação automática de notas fiscais' },
];

export interface Job {
  role: string;
  org: string;
  period: string;
  mode: string;
  tech: readonly string[];
  /** cada entrega; `**trecho**` vira destaque */
  bullets: readonly string[];
}

export const JOBS: readonly Job[] = [
  {
    role: 'Desenvolvedor FullStack', org: 'Agile Connect', period: 'jun 2026 — set 2026', mode: 'Híbrido',
    tech: ['.NET 8', '.NET 9', '.NET 10', 'React', 'SQL Server', 'T-SQL', 'xUnit', 'Webhooks', 'Workers', 'Azure', 'DevOps', 'Claude Code', 'OpenCode', 'Jira'],
    bullets: [
      'Integrei e mantive o fluxo de APIs financeiras, corrigindo a sincronização de status de cobrança com a instituição financeira por meio de webhooks.',
      'Refatorei transações síncronas para processamento assíncrono, reduzindo bloqueios e disparidades entre os sistemas.',
      'Implementei a alteração de contratos em lote via worker com processamento enfileirado, substituindo edições individuais.',
      'Otimizei consultas SQL e reduzi o carregamento do grid de contratos de **60 s para 4 s**, movendo o processamento para a camada de query.',
      'Criei triggers em SQL Server para sincronizar os sistemas de gestão de vendas e de ocorrências.',
      'Atuei na manutenção em produção com hotfixes, correções em logging e paginação, monitoramento via logs, testes unitários e code reviews.',
    ],
  },
  {
    role: 'Desenvolvedor Júnior', org: 'Mydas Tecnologia', period: 'out 2025 — jun 2026', mode: 'Presencial',
    tech: ['Node.js', 'Python', 'Flask', 'FastAPI', 'AWS Lambda', 'JasperReports', 'APIs Financeiras', 'ERP'],
    bullets: [
      'Desenvolvi uma customização no ERP Senior com Node.js na AWS, reduzindo o fechamento mensal de **5 dias para 4 horas** com mensageria assíncrona e geração automática de boletos a partir de NFs.',
      'Implementei um endpoint Flask/Python para gerar relatórios PDF com pyreportjasper e JasperReports, alimentado por um data lake de ordens de serviço.',
      'Entreguei mais de **12 relatórios** dinâmicos em JasperReports para clientes industriais e comerciais, com filtros avançados e cálculos de impostos parametrizados.',
      'Otimizei a regra em LSP de exportação automática de notas fiscais, reduzindo o processamento de **1 dia para 2 horas**.',
      'Capacitei colaboradores de indústrias em relatórios JasperReports integrados ao ERP Senior e levantei requisitos de relatórios complexos.',
    ],
  },
];

export interface Course {
  title: string;
  inst: string;
  note: string;
  /** ano e mês (1–12) de início e de fim; `going` quando ainda está em andamento (o fim é a previsão) */
  from: readonly [number, number];
  to: readonly [number, number];
  going?: boolean;
}

export const COURSES: readonly Course[] = [
  { title: 'Bacharelado em Engenharia de Software', inst: 'Unicesumar', note: '4º período.', from: [2024, 2], to: [2028, 4], going: true },
  { title: 'Técnico em Desenvolvimento de Sistemas', inst: 'FIEP', note: 'Federação das Indústrias do Estado do Paraná.', from: [2022, 3], to: [2023, 7] },
  { title: 'Inglês intermediário', inst: 'Indoor', note: 'Curso com um professor que morou na Austrália. Sigo praticando com leitura de conteúdos em inglês.', from: [2022, 5], to: [2023, 9] },
];

export const EMAIL = 'joaopedrosantanarosa@gmail.com';

export const CONTACTS: readonly { label: string; handle: string; href: string }[] = [
  { label: 'GitHub', handle: 'JoaoSanReboot', href: 'https://github.com/JoaoSanReboot' },
  { label: 'LinkedIn', handle: 'joaopedro-santanarosa', href: 'https://www.linkedin.com/in/joaopedro-santanarosa' },
  { label: 'Instagram', handle: '@joaopedro_snt_', href: 'https://www.instagram.com/joaopedro_snt_/' },
];
