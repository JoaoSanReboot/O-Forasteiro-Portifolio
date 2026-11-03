namespace Forasteiro.Api.Infrastructure.Cors;

// CORS só para a origem do frontend (Azure Static Web Apps em produção, ng serve em desenvolvimento),
// lida de Cors:AllowedOrigins; a API só serve leituras (GET)
public static class FrontendCors
{
    private const string Policy = "frontend";

    public static IServiceCollection AddFrontendCors(this IServiceCollection services, IConfiguration configuration)
    {
        var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        services.AddCors(options => options.AddPolicy(Policy, policy =>
            policy.WithOrigins(origins).WithMethods("GET").AllowAnyHeader()));
        return services;
    }

    public static IApplicationBuilder UseFrontendCors(this IApplicationBuilder app) => app.UseCors(Policy);
}
