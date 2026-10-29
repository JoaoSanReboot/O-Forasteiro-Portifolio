using System.Text.Json;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Forasteiro.Api.Features.GitHub;

// Alimenta a placa do telégrafo com as contribuições reais (era api/github-contributions.js na Vercel)
public static class ContributionsEndpoints
{
    private static readonly TimeSpan CacheFor = TimeSpan.FromHours(1);

    public static IServiceCollection AddGitHubContributions(this IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddSingleton(TimeProvider.System);
        services.AddOptions<GitHubOptions>()
            .BindConfiguration(GitHubOptions.Section)
            .PostConfigure<IConfiguration>((o, config) =>
            {
                // aceita também os nomes do legado (variáveis de ambiente da Vercel)
                if (string.IsNullOrWhiteSpace(o.Token)) o.Token = config["GITHUB_TOKEN"];
                if (string.IsNullOrWhiteSpace(o.Login)) o.Login = config["GITHUB_LOGIN"];
                if (string.IsNullOrWhiteSpace(o.Login)) o.Login = GitHubOptions.DefaultLogin;
            });
        services.AddHttpClient<GitHubClient>(http =>
        {
            http.BaseAddress = new Uri("https://api.github.com/");
            http.DefaultRequestHeaders.UserAgent.ParseAdd("portfolio-forasteiro");
            http.Timeout = TimeSpan.FromSeconds(15);
        });
        return services;
    }

    public static IEndpointRouteBuilder MapGitHubContributions(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/github/contributions", GetContributions);
        return app;
    }

    private static async Task<Results<Ok<ContributionsResponse>, JsonHttpResult<ContributionsError>>> GetContributions(
        GitHubClient github, IMemoryCache cache, IOptions<GitHubOptions> options, TimeProvider time, HttpResponse response, CancellationToken ct)
    {
        var (token, login) = (options.Value.Token, options.Value.Login ?? GitHubOptions.DefaultLogin);
        if (string.IsNullOrWhiteSpace(token))
            return Error(StatusCodes.Status503ServiceUnavailable, "missing_token", "Configure GitHub:Token (ou GITHUB_TOKEN) na configuração da API.");

        // uma hora de cache: a placa não precisa bater no GitHub a cada visita
        var key = $"github:contributions:{login}";
        if (!cache.TryGetValue(key, out ContributionsResponse? body) || body is null)
        {
            GraphQlResponse json;
            try
            {
                json = await github.GetCalendarAsync(login, token, ct);
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
                .Select(d => new ContributionDay(d.Date, d.ContributionCount, ContributionLevels.ToNumber(d.ContributionLevel)))
                .ToArray();
            body = new ContributionsResponse(calendar.TotalContributions, days, time.GetUtcNow());
            cache.Set(key, body, CacheFor);
        }

        // e na borda também, como no legado
        response.Headers.CacheControl = "s-maxage=3600, stale-while-revalidate=86400";
        return TypedResults.Ok(body);
    }

    private static JsonHttpResult<ContributionsError> Error(int status, string error, string details) =>
        TypedResults.Json(new ContributionsError(error, details), statusCode: status);
}

/// <summary>Resposta da placa: <c>{ total, days: [{ date: "AAAA-MM-DD", count, level: 0-4 }], fetchedAt }</c>.</summary>
public sealed record ContributionsResponse(int Total, IReadOnlyList<ContributionDay> Days, DateTimeOffset FetchedAt);
public sealed record ContributionDay(string Date, int Count, int Level);
public sealed record ContributionsError(string Error, string Details);
