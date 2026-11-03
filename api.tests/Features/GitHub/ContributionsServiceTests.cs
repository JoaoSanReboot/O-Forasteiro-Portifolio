using System.Net;
using Forasteiro.Api.Features.GitHub;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Forasteiro.Api.Tests.Features.GitHub;

// a regra da placa sem HTTP no meio: o resultado de cada caso, a conversão dos dias e o cache
public sealed class ContributionsServiceTests
{
    private const string Calendar = """
        { "data": { "user": { "contributionsCollection": { "contributionCalendar": {
          "totalContributions": 3,
          "weeks": [ { "contributionDays": [
            { "date": "2026-11-01", "contributionCount": 3, "contributionLevel": "SECOND_QUARTILE" }
          ] } ]
        } } } } }
        """;

    private static ContributionsService Service(FakeGitHubHandler github, string? token = "token-de-teste", IMemoryCache? cache = null) => new(
        new GitHubClient(new HttpClient(github) { BaseAddress = new Uri("https://api.github.example/") }),
        cache ?? new MemoryCache(new MemoryCacheOptions()),
        Options.Create(new GitHubOptions { Token = token, Login = "alguem" }),
        TimeProvider.System);

    [Fact]
    public async Task Sem_token_nem_chama_o_GitHub()
    {
        var github = FakeGitHubHandler.Json(Calendar);

        var outcome = await Service(github, token: null).GetAsync(CancellationToken.None);

        Assert.Equal(ContributionsFailure.MissingToken, Assert.IsType<ContributionsOutcome.Failure>(outcome).Reason);
        Assert.Equal(0, github.Calls);
    }

    [Fact]
    public async Task Converte_o_calendario_e_guarda_por_uma_hora()
    {
        var github = FakeGitHubHandler.Json(Calendar);
        var cache = new MemoryCache(new MemoryCacheOptions());

        var first = Assert.IsType<ContributionsOutcome.Success>(await Service(github, cache: cache).GetAsync(CancellationToken.None));
        var second = Assert.IsType<ContributionsOutcome.Success>(await Service(github, cache: cache).GetAsync(CancellationToken.None));

        Assert.Equal(3, first.Body.Total);
        Assert.Equal(new ContributionDay("2026-11-01", 3, 2), Assert.Single(first.Body.Days));
        Assert.Same(first.Body, second.Body);
        Assert.Equal(1, github.Calls);
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized, ContributionsFailure.GitHubError)]
    [InlineData(HttpStatusCode.BadGateway, ContributionsFailure.GitHubError)]
    public async Task Status_de_erro_do_GitHub(HttpStatusCode status, ContributionsFailure expected)
    {
        var outcome = await Service(FakeGitHubHandler.Json("{}", status)).GetAsync(CancellationToken.None);

        var failure = Assert.IsType<ContributionsOutcome.Failure>(outcome);
        Assert.Equal(expected, failure.Reason);
        Assert.Contains(((int)status).ToString(System.Globalization.CultureInfo.InvariantCulture), failure.Details, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Sem_rede_vira_falha_de_conexao()
    {
        var outcome = await Service(FakeGitHubHandler.Throws(new HttpRequestException("sem rede"))).GetAsync(CancellationToken.None);

        Assert.Equal(ContributionsFailure.NetworkError, Assert.IsType<ContributionsOutcome.Failure>(outcome).Reason);
    }

    [Fact]
    public async Task Sem_calendario_repassa_os_erros_do_GitHub()
    {
        var outcome = await Service(FakeGitHubHandler.Json("""{ "data": { "user": null }, "errors": [ { "message": "Usuário não existe." } ] }""")).GetAsync(CancellationToken.None);

        var failure = Assert.IsType<ContributionsOutcome.Failure>(outcome);
        Assert.Equal(ContributionsFailure.NoData, failure.Reason);
        Assert.Equal("Usuário não existe.", failure.Details);
    }
}
