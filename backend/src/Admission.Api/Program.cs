using Admission.Api.Data;
using Admission.Api.Errors;
using Admission.Api.Features.Classes;
using Admission.Api.Students;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Connection string comes from ConnectionStrings__Default (set by docker compose);
// appsettings.json has a localhost default for running outside Docker.
builder.Services.AddDbContext<AdmissionDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Unhandled exceptions become JSON error bodies (see ApiExceptionHandler).
// AddProblemDetails is required by UseExceptionHandler(); our handler always answers first.
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();

// Outside Development, minimal APIs answer a malformed body with an empty 400.
// Throwing instead routes it through ApiExceptionHandler, which adds the JSON error body.
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = true);

// The frontend (http://localhost:3000) is a different origin from the API (:8080),
// so the browser needs CORS. Origins come from Cors:AllowedOrigins (comma-separated).
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(allowedOrigins)
    .WithMethods("GET", "POST", "DELETE")
    .WithHeaders("Content-Type", StudentId.HeaderName)));

var app = builder.Build();

// Creates or updates the schema on startup. Tests that run without a database
// switch it off with Database:MigrateOnStartup=false.
if (app.Configuration.GetValue("Database:MigrateOnStartup", true))
{
    await app.MigrateWithRetryAsync();
}

app.UseExceptionHandler();
app.UseJsonStatusCodeBodies();
app.UseCors();

// Liveness probe used by Docker and by the smoke test.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapClassEndpoints();

app.Run();

// Exposes the implicit Program class to WebApplicationFactory in the test project.
public partial class Program;
