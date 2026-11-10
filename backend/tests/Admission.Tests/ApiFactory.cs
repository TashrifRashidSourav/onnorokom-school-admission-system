using Admission.Api.Features.Holds;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Admission.Tests;

/// <summary>
/// Hosts the API in memory for tests that do not need a database
/// (migrations on startup are switched off).
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Database:MigrateOnStartup", "false");
        // No database here, so no background expiry sweeps either.
        builder.UseSetting(ExpirySweepSettings.ConfigKey, "0");
    }
}
