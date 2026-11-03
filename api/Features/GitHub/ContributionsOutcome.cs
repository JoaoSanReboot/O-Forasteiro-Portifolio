namespace Forasteiro.Api.Features.GitHub;

/// <summary>Por que a placa não pôde ser montada (o endpoint traduz cada caso para um status HTTP).</summary>
public enum ContributionsFailure
{
    /// <summary>Sem token configurado na API.</summary>
    MissingToken,
    /// <summary>O GitHub respondeu fora de 2xx ou mandou algo que não deu para ler.</summary>
    GitHubError,
    /// <summary>Sem conexão com o GitHub (falha de rede ou tempo esgotado).</summary>
    NetworkError,
    /// <summary>O GitHub não devolveu calendário (ex.: usuário inexistente).</summary>
    NoData,
}

/// <summary>O resultado da busca: o calendário pronto ou o motivo da falha, com uma explicação para quem configura.</summary>
public abstract record ContributionsOutcome
{
    public sealed record Success(ContributionsResponse Body) : ContributionsOutcome;
    public sealed record Failure(ContributionsFailure Reason, string Details) : ContributionsOutcome;
}
