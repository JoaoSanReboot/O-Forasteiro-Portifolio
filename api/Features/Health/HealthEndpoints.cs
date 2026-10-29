namespace Forasteiro.Api.Features.Health;

// usado pela verificação de integridade do Azure App Service
public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealth(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health", () => TypedResults.Ok(new HealthResponse("ok")));
        return app;
    }
}

public sealed record HealthResponse(string Status);
