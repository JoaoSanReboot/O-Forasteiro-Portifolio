using Forasteiro.Api.Features.GitHub;
using Forasteiro.Api.Features.Health;
using Forasteiro.Api.Infrastructure.Cors;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFrontendCors(builder.Configuration);
builder.Services.AddGitHubContributions();

var app = builder.Build();

app.UseFrontendCors();
app.MapHealth();
app.MapGitHubContributions();

app.Run();

// exposto para os testes de integração (WebApplicationFactory)
public partial class Program;
