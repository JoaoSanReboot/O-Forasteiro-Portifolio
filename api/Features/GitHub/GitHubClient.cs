using System.Net.Http.Headers;

namespace Forasteiro.Api.Features.GitHub;

// O calendário de contribuições só existe na API GraphQL do GitHub, e ela exige um token
public sealed class GitHubClient(HttpClient http)
{
    private const string Query = """
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks { contributionDays { date contributionCount contributionLevel } }
              }
            }
          }
        }
        """;

    /// <summary>
    /// Consulta o calendário do último ano. Resposta fora de 2xx lança <see cref="HttpRequestException"/>
    /// com <c>StatusCode</c>; falha de rede lança a mesma exceção sem ele.
    /// </summary>
    public async Task<GraphQlResponse> GetCalendarAsync(string login, string token, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "graphql")
        {
            Content = JsonContent.Create(new { query = Query, variables = new { login } }),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("bearer", token);
        using var response = await http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<GraphQlResponse>(ct) ?? new GraphQlResponse(null, null);
    }
}

// só os campos que a consulta pede
public sealed record GraphQlResponse(GraphQlData? Data, IReadOnlyList<GraphQlError>? Errors);
public sealed record GraphQlError(string? Message);
public sealed record GraphQlData(GraphQlUser? User);
public sealed record GraphQlUser(GraphQlContributions? ContributionsCollection);
public sealed record GraphQlContributions(GraphQlCalendar? ContributionCalendar);
public sealed record GraphQlCalendar(int TotalContributions, IReadOnlyList<GraphQlWeek> Weeks);
public sealed record GraphQlWeek(IReadOnlyList<GraphQlDay> ContributionDays);
public sealed record GraphQlDay(string Date, int ContributionCount, string? ContributionLevel);
