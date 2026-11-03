using Forasteiro.Backend;

var builder = WebApplication.CreateBuilder(args);

// em desenvolvimento, o GITHUB_TOKEN vem do .env da raiz do repositório (fora do git)
if (builder.Environment.IsDevelopment())
{
    var envFile = Path.Combine(builder.Environment.ContentRootPath, "..", ".env");
    if (File.Exists(envFile))
    {
        var values = File.ReadAllLines(envFile)
            .Select(line => line.Trim())
            .Where(line => line.Length > 0 && !line.StartsWith('#') && line.IndexOf('=') > 0)
            .Select(line => line.Split('=', 2))
            .ToDictionary(kv => kv[0].Trim(), kv => (string?)kv[1].Trim().Trim('"', '\''));
        builder.Configuration.AddInMemoryCollection(values);
    }
}

// CORS só para a origem do site (Static Web Apps em produção, ng serve em desenvolvimento), só leitura
var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(origins).WithMethods("GET").AllowAnyHeader()));
builder.Services.AddGitHubContributions();

var app = builder.Build();
app.UseCors();
app.MapGitHubContributions();
app.Run();
