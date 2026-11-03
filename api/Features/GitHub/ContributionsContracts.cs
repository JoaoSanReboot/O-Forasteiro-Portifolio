namespace Forasteiro.Api.Features.GitHub;

/// <summary>Resposta da placa: <c>{ total, days: [{ date: "AAAA-MM-DD", count, level: 0-4 }], fetchedAt }</c>.</summary>
public sealed record ContributionsResponse(int Total, IReadOnlyList<ContributionDay> Days, DateTimeOffset FetchedAt);
public sealed record ContributionDay(string Date, int Count, int Level);

/// <summary>Corpo das respostas de erro: <c>{ error, details }</c>.</summary>
public sealed record ContributionsError(string Error, string Details);
