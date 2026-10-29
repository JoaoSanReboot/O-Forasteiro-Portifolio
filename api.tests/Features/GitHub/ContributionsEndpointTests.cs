using System.Net;
using System.Net.Http.Json;
using Forasteiro.Api.Features.GitHub;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Forasteiro.Api.Tests.Features.GitHub;

public sealed class ContributionsEndpointTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Url = "/api/github/contributions";

    private const string Calendar = """
        { "data": { "user": { "contributionsCollection": { "contributionCalendar": {
          "totalContributions": 7,
          "weeks": [
            { "contributionDays": [
              { "date": "2026-10-25", "contributionCount": 0, "contributionLevel": "NONE" },
              { "date": "2026-10-26", "contributionCount": 1, "contributionLevel": "FIRST_QUARTILE" }
            ] },
            { "contributionDays": [
              { "date": "2026-11-01", "contributionCount": 6, "contributionLevel": "FOURTH_QUARTILE" },
              { "date": "2026-11-02", "contributionCount": 0, "contributionLevel": "OUTRO_NIVEL" }
            ] }
          ]
        } } } } }
        """;

    // ambiente "Testing" para não ler os user-secrets da máquina; o token aqui é de mentira
    private HttpClient Client(FakeGitHubHandler github, string token = "token-de-teste", string? login = null) => factory
        .WithWebHostBuilder(b =>
        {
            b.UseEnvironment("Testing");
            b.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GitHub:Token"] = token,
                ["GITHUB_TOKEN"] = token,
                ["GitHub:Login"] = login,
                ["GITHUB_LOGIN"] = null,
            }));
            b.ConfigureTestServices(s => s.AddHttpClient<GitHubClient>().ConfigurePrimaryHttpMessageHandler(() => github));
        })
        .CreateClient();

    [Fact]
    public async Task Devolve_o_calendario_achatado_com_os_niveis()
    {
        var github = FakeGitHubHandler.Json(Calendar);

        var response = await Client(github).GetAsync(Url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ContributionsResponse>();
        Assert.NotNull(body);
        Assert.Equal(7, body.Total);
        Assert.Equal(
            [new("2026-10-25", 0, 0), new("2026-10-26", 1, 1), new("2026-11-01", 6, 4), new("2026-11-02", 0, 0)],
            body.Days);
        Assert.True(DateTimeOffset.UtcNow - body.FetchedAt < TimeSpan.FromMinutes(1));
        Assert.Equal("bearer token-de-teste", github.LastAuthorization);
        Assert.Contains("\"login\":\"JoaoSanReboot\"", github.LastBody, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Manda_o_cabecalho_de_cache_da_borda()
    {
        var response = await Client(FakeGitHubHandler.Json(Calendar)).GetAsync(Url);

        Assert.Equal("s-maxage=3600, stale-while-revalidate=86400", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task Guarda_por_uma_hora_e_nao_consulta_o_GitHub_de_novo()
    {
        var github = FakeGitHubHandler.Json(Calendar);
        var client = Client(github);

        var first = await client.GetFromJsonAsync<ContributionsResponse>(Url);
        var second = await client.GetFromJsonAsync<ContributionsResponse>(Url);

        Assert.Equal(1, github.Calls);
        Assert.Equal(first?.FetchedAt, second?.FetchedAt);
    }

    [Fact]
    public async Task Usa_o_login_configurado()
    {
        var github = FakeGitHubHandler.Json(Calendar);

        await Client(github, login: "OutroForasteiro").GetAsync(Url);

        Assert.Contains("\"login\":\"OutroForasteiro\"", github.LastBody, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Sem_token_responde_503_sem_chamar_o_GitHub()
    {
        var github = FakeGitHubHandler.Json(Calendar);

        var response = await Client(github, token: "").GetAsync(Url);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        await AssertError(response, "missing_token");
        Assert.Equal(0, github.Calls);
    }

    [Fact]
    public async Task Erro_do_GitHub_responde_502()
    {
        var response = await Client(FakeGitHubHandler.Json("{}", HttpStatusCode.Unauthorized)).GetAsync(Url);

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        var error = await AssertError(response, "github_error");
        Assert.Contains("401", error.Details, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Falha_de_rede_responde_502()
    {
        var response = await Client(FakeGitHubHandler.Throws(new HttpRequestException("sem rede"))).GetAsync(Url);

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        await AssertError(response, "network_error");
    }

    [Fact]
    public async Task Sem_dados_responde_404_com_os_erros_do_GitHub()
    {
        var github = FakeGitHubHandler.Json("""{ "data": { "user": null }, "errors": [{ "message": "Could not resolve to a User." }] }""");

        var response = await Client(github).GetAsync(Url);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await AssertError(response, "no_data");
        Assert.Equal("Could not resolve to a User.", error.Details);
    }

    [Fact]
    public async Task Erro_nao_fica_no_cache()
    {
        var github = FakeGitHubHandler.Json("{}", HttpStatusCode.InternalServerError);
        var client = Client(github);

        await client.GetAsync(Url);
        await client.GetAsync(Url);

        Assert.Equal(2, github.Calls);
    }

    private static async Task<ContributionsError> AssertError(HttpResponseMessage response, string error)
    {
        var body = await response.Content.ReadFromJsonAsync<ContributionsError>();
        Assert.NotNull(body);
        Assert.Equal(error, body.Error);
        Assert.False(string.IsNullOrWhiteSpace(body.Details));
        return body;
    }
}
