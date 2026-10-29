// as prateleiras do armeiro (seção Skills)
export interface Shelf {
  readonly label: string;
  readonly items: readonly string[];
}

export const SKILL_SHELVES: readonly Shelf[] = [
  { label: 'Backend', items: ['C#', '.NET 8/9/10', 'ASP.NET Core', 'ASP.NET MVC', 'Entity Framework Core', 'LINQ', 'Clean Architecture', 'Hangfire', 'xUnit'] },
  { label: 'Banco de dados', items: ['SQL Server', 'T-SQL', 'PostgreSQL'] },
  { label: 'Integrações', items: ['APIs REST', 'Webhooks', 'AWS Lambda', 'Node.js', 'Python/Flask', 'ERP', 'LSP'] },
  { label: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'React Native'] },
  { label: 'Ferramentas', items: ['Git', 'Azure DevOps', 'Jira', 'JasperReports', 'Claude Code'] },
];
