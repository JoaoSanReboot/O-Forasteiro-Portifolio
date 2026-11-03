using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Caching.Memory;

namespace Forasteiro.Backend;

// A placa do telégrafo: GET /api/github/contributions busca o calendário de contribuições do GitHub
// (só existe na API GraphQL, que exige token) e devolve os dias com a contagem e o tom 0-4, guardados por uma hora.
// O token NUNCA vai para o navegador: GITHUB_TOKEN vem do .env em desenvolvimento e da configuração do App Service em produção.
//   resposta: { total, days: [{ date: "AAAA-MM-DD", count, level }], fetchedAt }
//   erro:     { error, details }  (503 missing_token, 502 github_error/network_error, 404 no_data)
public static class GitHubContributions
{
    private const string DefaultLogin = "JoaoSanReboot";
    private static readonly TimeSpan CacheFor = TimeSpan.FromHours(1);

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

    public static IServiceCollection AddGitHubContributions(this IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddHttpClient(nameof(GitHubContributions), http =>
        {
            http.BaseAddress = new Uri("https://api.github.com/");
            http.DefaultRequestHeaders.UserAgent.ParseAdd("portfolio-forasteiro");
            http.Timeout = TimeSpan.FromSeconds(15);
        });
        return services;
    }

    public static IEndpointRouteBuilder MapGitHubContributions(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/github/contributions", GetAsync);
        return app;
    }

    private static async Task<Results<Ok<ContributionsResponse>, JsonHttpResult<ContributionsError>>> GetAsync(
        IConfiguration config, IHttpClientFactory httpFactory, IMemoryCache cache, HttpResponse response, CancellationToken ct)
    {
        var token = config["GITHUB_TOKEN"] ?? config["GitHub:Token"];
        var login = config["GITHUB_LOGIN"] ?? config["GitHub:Login"] ?? DefaultLogin;
        if (string.IsNullOrWhiteSpace(token))
            return Error(StatusCodes.Status503ServiceUnavailable, "missing_token", "Configure GITHUB_TOKEN na configuração da API.");

        var key = $"github:contributions:{login}";
        if (!cache.TryGetValue(key, out ContributionsResponse? body) || body is null)
        {
            GraphQlResponse json;
            try
            {
                json = await FetchCalendarAsync(httpFactory.CreateClient(nameof(GitHubContributions)), login, token, ct);
            }
            catch (HttpRequestException e) when (e.StatusCode is { } status)
            {
                return Error(StatusCodes.Status502BadGateway, "github_error", $"O GitHub respondeu {(int)status}.");
            }
            catch (JsonException)
            {
                return Error(StatusCodes.Status502BadGateway, "github_error", "O GitHub mandou uma resposta que não deu para ler.");
            }
            catch (Exception e) when (e is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
            {
                return Error(StatusCodes.Status502BadGateway, "network_error", "Sem conexão com o GitHub.");
            }

            var calendar = json.Data?.User?.ContributionsCollection?.ContributionCalendar;
            if (calendar is null)
            {
                var errors = json.Errors?.Select(x => x.Message).OfType<string>().ToArray() ?? [];
                return Error(StatusCodes.Status404NotFound, "no_data", errors.Length > 0 ? string.Join(" ", errors) : $"Nenhum calendário para {login}.");
            }

            var days = calendar.Weeks
                .SelectMany(w => w.ContributionDays)
                .Select(d => new ContributionDay(d.Date, d.ContributionCount, ToLevel(d.ContributionLevel)))
                .ToArray();
            body = new ContributionsResponse(calendar.TotalContributions, days, DateTimeOffset.UtcNow);
            cache.Set(key, body, CacheFor);
        }

        // e na borda (CDN) também
        response.Headers.CacheControl = "s-maxage=3600, stale-while-revalidate=86400";
        return TypedResults.Ok(body);
    }

    // resposta fora de 2xx lança HttpRequestException com StatusCode; falha de rede, a mesma exceção sem ele
    private static async Task<GraphQlResponse> FetchCalendarAsync(HttpClient http, string login, string token, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "graphql")
        {
            Content = JsonContent.Create(new { query = Query, variables = new { login } }),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("bearer", token);
        using var result = await http.SendAsync(request, ct);
        result.EnsureSuccessStatusCode();
        return await result.Content.ReadFromJsonAsync<GraphQlResponse>(ct) ?? new GraphQlResponse(null, null);
    }

    // os quartis do GitHub viram os tons da placa (l1..l4); qualquer valor novo fica apagado
    private static int ToLevel(string? level) => level switch
    {
        "FIRST_QUARTILE" => 1,
        "SECOND_QUARTILE" => 2,
        "THIRD_QUARTILE" => 3,
        "FOURTH_QUARTILE" => 4,
        _ => 0,
    };

    private static JsonHttpResult<ContributionsError> Error(int status, string error, string details) =>
        TypedResults.Json(new ContributionsError(error, details), statusCode: status);

    private sealed record ContributionsResponse(int Total, IReadOnlyList<ContributionDay> Days, DateTimeOffset FetchedAt);
    private sealed record ContributionDay(string Date, int Count, int Level);
    private sealed record ContributionsError(string Error, string Details);

    // a resposta do GraphQL: só os campos que a consulta pede
    private sealed record GraphQlResponse(GraphQlData? Data, IReadOnlyList<GraphQlError>? Errors);
    private sealed record GraphQlError(string? Message);
    private sealed record GraphQlData(GraphQlUser? User);
    private sealed record GraphQlUser(GraphQlContributions? ContributionsCollection);
    private sealed record GraphQlContributions(GraphQlCalendar? ContributionCalendar);
    private sealed record GraphQlCalendar(int TotalContributions, IReadOnlyList<GraphQlWeek> Weeks);
    private sealed record GraphQlWeek(IReadOnlyList<GraphQlDay> ContributionDays);
    private sealed record GraphQlDay(string Date, int ContributionCount, string? ContributionLevel);
}
