using Admission.Api.Data;
using Admission.Api.Features.Holds;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Admission.Tests.Infrastructure;

/// <summary>
/// Hosts the API in memory against a real PostgreSQL database, so tests exercise the
/// same SQL, constraints and locking as production. The schema is created by the app's
/// own startup migration.
///
/// The database comes from TEST_DB_CONNECTION; the default matches the db-test service
/// of the compose "test" profile published on localhost:5433.
/// </summary>
public class PostgresApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string ConnectionEnvVar = "TEST_DB_CONNECTION";

    public static string ConnectionString =>
        Environment.GetEnvironmentVariable(ConnectionEnvVar) is { Length: > 0 } fromEnv
            ? fromEnv
            : "Host=localhost;Port=5433;Database=admission_test;Username=admission;Password=admission";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Default", WithSmallPool(ConnectionString));
        builder.UseSetting("Database:MigrateOnStartup", "true");
        // No background sweeps during tests: each test decides when holds are saved as
        // EXPIRED, so results never depend on timing. The sweeper has its own tests.
        builder.UseSetting(ExpirySweepSettings.ConfigKey, "0");
    }

    /// <summary>
    /// Caps each test app at 30 database connections. PostgreSQL accepts about 100 in
    /// total, and Npgsql would otherwise open up to 100 per app: after the concurrency
    /// tests fill one app's pool, a second app (e.g. one with 1-second holds) would get
    /// "too many clients". Requests beyond 30 wait for a free connection, which still
    /// makes them compete for the same rows.
    /// </summary>
    private static string WithSmallPool(string connectionString) =>
        new NpgsqlConnectionStringBuilder(connectionString) { MaxPoolSize = 30 }.ConnectionString;

    /// <summary>Starts the app once per test run, which applies the migrations.</summary>
    public Task InitializeAsync()
    {
        _ = Server;
        return Task.CompletedTask;
    }

    public new Task DisposeAsync() => base.DisposeAsync().AsTask();

    /// <summary>Deletes all rows so the next test starts from empty tables.</summary>
    public Task ResetDatabaseAsync() =>
        WithDbAsync(db => db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE holds, classes CASCADE"));

    /// <summary>Runs <paramref name="action"/> with a fresh DbContext from the app's container.</summary>
    public async Task<T> WithDbAsync<T>(Func<AdmissionDbContext, Task<T>> action)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
        return await action(db);
    }
}

/// <summary>
/// All database tests share one app and one database, so they run one at a time
/// (xUnit runs tests in the same collection sequentially).
/// </summary>
[CollectionDefinition(Name)]
public class DatabaseCollection : ICollectionFixture<PostgresApiFactory>
{
    public const string Name = "Database";
}
