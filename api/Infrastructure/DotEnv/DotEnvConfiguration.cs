namespace Forasteiro.Api.Infrastructure.DotEnv;

// Lê um arquivo .env (CHAVE=valor por linha) só em desenvolvimento, para o GITHUB_TOKEN local.
// Procura na pasta da API e na raiz do repositório. O .env está no .gitignore e nunca vai para o git;
// em produção a configuração vem do App Service.
public static class DotEnvConfiguration
{
    public static IConfigurationBuilder AddDotEnv(this IConfigurationBuilder config, IHostEnvironment env)
    {
        if (!env.IsDevelopment()) return config;

        var root = env.ContentRootPath;
        var candidates = new[] { Path.Combine(root, ".env"), Path.Combine(Directory.GetParent(root)?.FullName ?? root, ".env") };
        var file = candidates.FirstOrDefault(File.Exists);
        return file is null ? config : config.AddInMemoryCollection(Parse(File.ReadAllLines(file)));
    }

    // Linhas em branco e comentários (#) são ignorados; aceita "export " na frente e aspas em volta do valor
    public static Dictionary<string, string?> Parse(IEnumerable<string> lines)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in lines)
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;
            if (line.StartsWith("export ", StringComparison.Ordinal))line = line["export ".Length..].TrimStart();

            var eq = line.IndexOf('=');
            if (eq <= 0) continue;

            var key = line[..eq].Trim();
            var value = line[(eq + 1)..].Trim();
            if (value.Length >= 2 && (value[0] == '"' || value[0] == '\'') && value[^1] == value[0])
                value = value[1..^1];

            values[key] = value;
        }
        return values;
    }
}
