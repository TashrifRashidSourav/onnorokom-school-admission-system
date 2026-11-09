using Admission.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Admission.Tests.Infrastructure;

public class DatabaseSmokeTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    [Fact]
    public async Task Startup_applies_all_migrations()
    {
        var pending = await Factory.WithDbAsync(db => db.Database.GetPendingMigrationsAsync());

        Assert.Empty(pending);
    }

    [Fact]
    public async Task Each_test_starts_with_empty_tables()
    {
        Assert.Equal(0, await Factory.WithDbAsync(db => db.Classes.CountAsync()));
        Assert.Equal(0, await Factory.WithDbAsync(db => db.Holds.CountAsync()));
    }

    [Fact]
    public async Task Reset_removes_classes_and_holds()
    {
        await Factory.WithDbAsync(async db =>
        {
            var schoolClass = new SchoolClass { Name = "Smoke", TotalSeats = 1 };
            db.Classes.Add(schoolClass);
            db.Holds.Add(new Hold
            {
                ClassId = schoolClass.Id,
                StudentId = "20152691234567890",
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            });
            return await db.SaveChangesAsync();
        });

        await Factory.ResetDatabaseAsync();

        Assert.Equal(0, await Factory.WithDbAsync(db => db.Classes.CountAsync()));
        Assert.Equal(0, await Factory.WithDbAsync(db => db.Holds.CountAsync()));
    }
}
