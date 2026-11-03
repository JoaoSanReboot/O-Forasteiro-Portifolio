namespace Forasteiro.Api.Features.GitHub;

// O registro da placa do GitHub: configuração (com as variáveis de ambiente como alternativa),
// o cliente HTTP do GitHub, o cache e a regra
public static class GitHubServiceCollectionExtensions
{
    public static IServiceCollection AddGitHubContributions(this IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddSingleton(TimeProvider.System);
        services.AddOptions<GitHubOptions>()
            .BindConfiguration(GitHubOptions.Section)
            .PostConfigure<IConfiguration>((o, config) =>
            {
                // aceita também as variáveis de ambiente GITHUB_TOKEN e GITHUB_LOGIN
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
        services.AddTransient<ContributionsService>();
        return services;
    }
}
