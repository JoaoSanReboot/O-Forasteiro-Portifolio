using System.Net;
using System.Net.Http.Json;
using Forasteiro.Api.Features.Health;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Forasteiro.Api.Tests.Features.Health;

public sealed class HealthEndpointTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Responde_ok()
    {
        var response = await factory.CreateClient().GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.Equal("ok", body?.Status);
    }
}
