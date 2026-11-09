using Microsoft.EntityFrameworkCore;

namespace Admission.Tests.Infrastructure;

[Collection(DatabaseCollection.Name)]
public class DatabaseSmokeTests(PostgresApiFactory factory)
{
    [Fact]
    public async Task Startup_applies_all_migrations()
    {
        var pending = await factory.WithDbAsync(db => db.Database.GetPendingMigrationsAsync());

        Assert.Empty(pending);
    }

    [Fact]
    public async Task Tables_are_queryable()
    {
        var classCount = await factory.WithDbAsync(db => db.Classes.CountAsync());
        var holdCount = await factory.WithDbAsync(db => db.Holds.CountAsync());

        Assert.True(classCount >= 0);
        Assert.True(holdCount >= 0);
    }
}
