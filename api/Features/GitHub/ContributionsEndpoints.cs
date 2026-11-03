using Microsoft.AspNetCore.Http.HttpResults;

namespace Forasteiro.Api.Features.GitHub;

// GET /api/github/contributions: alimenta a placa do telégrafo com as contribuições reais.
// Aqui só a tradução para HTTP; a regra está no ContributionsService.
public static class ContributionsEndpoints
{
    public static IEndpointRouteBuilder MapGitHubContributions(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/github/contributions", GetContributions);
        return app;
    }

    private static async Task<Results<Ok<ContributionsResponse>, JsonHttpResult<ContributionsError>>> GetContributions(
        ContributionsService contributions, HttpResponse response, CancellationToken ct)
    {
        switch (await contributions.GetAsync(ct))
        {
            case ContributionsOutcome.Success(var body):
                // e na borda (CDN) também
                response.Headers.CacheControl = "s-maxage=3600, stale-while-revalidate=86400";
                return TypedResults.Ok(body);
            case ContributionsOutcome.Failure(var reason, var details):
                var (status, error) = Describe(reason);
                return TypedResults.Json(new ContributionsError(error, details), statusCode: status);
            default:
                throw new InvalidOperationException("Resultado desconhecido.");
        }
    }

    // o status e o código de erro que a placa (e quem configura) recebem
    private static (int Status, string Error) Describe(ContributionsFailure reason) => reason switch
    {
        ContributionsFailure.MissingToken => (StatusCodes.Status503ServiceUnavailable, "missing_token"),
        ContributionsFailure.GitHubError => (StatusCodes.Status502BadGateway, "github_error"),
        ContributionsFailure.NetworkError => (StatusCodes.Status502BadGateway, "network_error"),
        ContributionsFailure.NoData => (StatusCodes.Status404NotFound, "no_data"),
        _ => throw new ArgumentOutOfRangeException(nameof(reason), reason, null),
    };
}
