using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Forasteiro.Api.Features.GitHub;

// A regra da placa: o calendário do GitHub vira os dias da placa (contagem e tom 0-4), guardado por uma hora.
// Não conhece HTTP: devolve o resultado, e o endpoint decide o status.
public sealed class ContributionsService(GitHubClient github, IMemoryCache cache, IOptions<GitHubOptions> options, TimeProvider time)
{
    private static readonly TimeSpan CacheFor = TimeSpan.FromHours(1);

    public async Task<ContributionsOutcome> GetAsync(CancellationToken ct)
    {
        var (token, login) = (options.Value.Token, options.Value.Login ?? GitHubOptions.DefaultLogin);
        if (string.IsNullOrWhiteSpace(token))
            return new ContributionsOutcome.Failure(ContributionsFailure.MissingToken, "Configure GitHub:Token (ou GITHUB_TOKEN) na configuração da API.");

        // uma hora de cache: a placa não precisa bater no GitHub a cada visita
        var key = $"github:contributions:{login}";
        if (cache.TryGetValue(key, out ContributionsResponse? cached) && cached is not null)
            return new ContributionsOutcome.Success(cached);

        GraphQlResponse json;
        try
        {
            json = await github.GetCalendarAsync(login, token, ct);
        }
        catch (HttpRequestException e) when (e.StatusCode is { } status)
        {
            return new ContributionsOutcome.Failure(ContributionsFailure.GitHubError, $"O GitHub respondeu {(int)status}.");
        }
        catch (JsonException)
        {
            return new ContributionsOutcome.Failure(ContributionsFailure.GitHubError, "O GitHub mandou uma resposta que não deu para ler.");
        }
        catch (Exception e) when (e is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            return new ContributionsOutcome.Failure(ContributionsFailure.NetworkError, "Sem conexão com o GitHub.");
        }

        var calendar = json.Data?.User?.ContributionsCollection?.ContributionCalendar;
        if (calendar is null)
        {
            var errors = json.Errors?.Select(x => x.Message).OfType<string>().ToArray() ?? [];
            return new ContributionsOutcome.Failure(ContributionsFailure.NoData, errors.Length > 0 ? string.Join(" ", errors) : $"Nenhum calendário para {login}.");
        }

        var body = new ContributionsResponse(calendar.TotalContributions, ToDays(calendar), time.GetUtcNow());
        cache.Set(key, body, CacheFor);
        return new ContributionsOutcome.Success(body);
    }

    private static ContributionDay[] ToDays(GraphQlCalendar calendar) => calendar.Weeks
        .SelectMany(w => w.ContributionDays)
        .Select(d => new ContributionDay(d.Date, d.ContributionCount, ContributionLevels.ToNumber(d.ContributionLevel)))
        .ToArray();
}
