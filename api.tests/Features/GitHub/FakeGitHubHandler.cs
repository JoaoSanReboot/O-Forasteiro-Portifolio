using System.Net;
using System.Text;

namespace Forasteiro.Api.Tests.Features.GitHub;

// faz o papel da API GraphQL do GitHub: os testes nunca saem para a rede
public sealed class FakeGitHubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
{
    public int Calls { get; private set; }
    public string? LastAuthorization { get; private set; }
    public string? LastBody { get; private set; }

    public static FakeGitHubHandler Json(string json, HttpStatusCode status = HttpStatusCode.OK) =>
        new(_ => new HttpResponseMessage(status) { Content = new StringContent(json, Encoding.UTF8, "application/json") });

    public static FakeGitHubHandler Throws(Exception e) => new(_ => throw e);

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Calls++;
        LastAuthorization = request.Headers.Authorization?.ToString();
        LastBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        return respond(request);
    }
}
