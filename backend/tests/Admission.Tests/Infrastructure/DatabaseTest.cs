namespace Admission.Tests.Infrastructure;

/// <summary>
/// Base class for tests that use the database. Every test starts with empty tables,
/// so tests never depend on each other's data or on the order they run in.
/// </summary>
[Collection(DatabaseCollection.Name)]
public abstract class DatabaseTest(PostgresApiFactory factory) : IAsyncLifetime
{
    protected PostgresApiFactory Factory { get; } = factory;

    protected HttpClient Client { get; } = factory.CreateClient();

    public Task InitializeAsync() => Factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;
}
