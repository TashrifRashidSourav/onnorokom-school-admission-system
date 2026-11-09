using Admission.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Connection string comes from ConnectionStrings__Default (set by docker compose);
// appsettings.json has a localhost default for running outside Docker.
builder.Services.AddDbContext<AdmissionDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var app = builder.Build();

// Creates or updates the schema on startup. Tests that run without a database
// switch it off with Database:MigrateOnStartup=false.
if (app.Configuration.GetValue("Database:MigrateOnStartup", true))
{
    await app.MigrateWithRetryAsync();
}

// Liveness probe used by Docker and by the smoke test.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

// Exposes the implicit Program class to WebApplicationFactory in the test project.
public partial class Program;
