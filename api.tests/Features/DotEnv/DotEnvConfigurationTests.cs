using Forasteiro.Api.Infrastructure.DotEnv;

namespace Forasteiro.Api.Tests.Features.DotEnv;

public sealed class DotEnvConfigurationTests
{
    [Fact]
    public void Le_chaves_e_ignora_comentarios_e_linhas_invalidas()
    {
        var values = DotEnvConfiguration.Parse(
        [
            "# comentário",
            "",
            "GITHUB_TOKEN=abc=123",
            "export GITHUB_LOGIN=\"Forasteiro\"",
            "SEM_IGUAL",
            "=sem_chave",
        ]);

        Assert.Equal(2, values.Count);
        Assert.Equal("abc=123", values["GITHUB_TOKEN"]);
        Assert.Equal("Forasteiro", values["GITHUB_LOGIN"]);
    }
}
