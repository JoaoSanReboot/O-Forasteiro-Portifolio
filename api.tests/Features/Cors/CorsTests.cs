using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Forasteiro.Api.Tests.Features.Cors;

public sealed class CorsTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Frontend = "https://forasteiro.example";

    private HttpClient Client() => factory
        .WithWebHostBuilder(b => b.UseSetting("Cors:AllowedOrigins:0", Frontend))
        .CreateClient();

    [Fact]
    public async Task Libera_a_origem_do_frontend()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/health");
        request.Headers.Add("Origin", Frontend);

        var response = await Client().SendAsync(request);

        Assert.Equal(Frontend, response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task Nao_libera_outras_origens()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/health");
        request.Headers.Add("Origin", "https://intruso.example");

        var response = await Client().SendAsync(request);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }
}
