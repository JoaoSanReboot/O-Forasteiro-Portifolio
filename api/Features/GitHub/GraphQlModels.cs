namespace Forasteiro.Api.Features.GitHub;

// A resposta da API GraphQL do GitHub: só os campos que a consulta pede
public sealed record GraphQlResponse(GraphQlData? Data, IReadOnlyList<GraphQlError>? Errors);
public sealed record GraphQlError(string? Message);
public sealed record GraphQlData(GraphQlUser? User);
public sealed record GraphQlUser(GraphQlContributions? ContributionsCollection);
public sealed record GraphQlContributions(GraphQlCalendar? ContributionCalendar);
public sealed record GraphQlCalendar(int TotalContributions, IReadOnlyList<GraphQlWeek> Weeks);
public sealed record GraphQlWeek(IReadOnlyList<GraphQlDay> ContributionDays);
public sealed record GraphQlDay(string Date, int ContributionCount, string? ContributionLevel);
