using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Admission.Tests;

public class HealthEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Health_returns_ok()
    {
        // The health check needs no database, so skip migrations for this test.
        var client = factory
            .WithWebHostBuilder(b => b.UseSetting("Database:MigrateOnStartup", "false"))
            .CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.Equal("ok", body?.Status);
    }

    private sealed record HealthResponse(string Status);
}
