var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// Liveness probe used by Docker and by the smoke test.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

// Exposes the implicit Program class to WebApplicationFactory in the test project.
public partial class Program;
