using Forasteiro.Api.Features.GitHub;
using Forasteiro.Api.Features.Health;

var builder = WebApplication.CreateBuilder(args);

// CORS só para a origem do frontend (Azure Static Web Apps em produção, ng serve em desenvolvimento)
const string FrontendCors = "frontend";
var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy(FrontendCors, policy =>
    policy.WithOrigins(origins).WithMethods("GET").AllowAnyHeader()));
builder.Services.AddGitHubContributions();

var app = builder.Build();

app.UseCors(FrontendCors);
app.MapHealth();
app.MapGitHubContributions();

app.Run();

// exposto para os testes de integração (WebApplicationFactory)
public partial class Program;
