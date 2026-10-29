namespace Forasteiro.Api.Features.GitHub;

// Configuração da placa do GitHub. O token NUNCA vai para o navegador: fica só aqui no servidor.
//   GitHub:Token (ou GITHUB_TOKEN)  token fine-grained só de leitura; em desenvolvimento via dotnet user-secrets,
//                                   no Azure App Service como configuração do app
//   GitHub:Login (ou GITHUB_LOGIN)  usuário do GitHub; padrão "JoaoSanReboot"
public sealed class GitHubOptions
{
    public const string Section = "GitHub";
    public const string DefaultLogin = "JoaoSanReboot";

    public string? Token { get; set; }
    public string? Login { get; set; }
}
