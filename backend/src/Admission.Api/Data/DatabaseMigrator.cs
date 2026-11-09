using Microsoft.EntityFrameworkCore;

namespace Admission.Api.Data;

public static class DatabaseMigrator
{
    private const int MaxAttempts = 15;
    private static readonly TimeSpan Delay = TimeSpan.FromSeconds(2);

    /// <summary>
    /// Applies pending EF migrations. Retries for about 30 seconds so the API can start
    /// even if PostgreSQL is still booting; compose already waits for the db healthcheck,
    /// this covers restarts and running outside compose.
    /// </summary>
    public static async Task MigrateWithRetryAsync(this WebApplication app)
    {
        var logger = app.Logger;

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await using var scope = app.Services.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
                await db.Database.MigrateAsync();
                logger.LogInformation("Database is up to date");
                return;
            }
            catch (Exception ex) when (attempt < MaxAttempts)
            {
                logger.LogWarning(
                    "Database not ready (attempt {Attempt}/{Max}): {Message}",
                    attempt, MaxAttempts, ex.Message);
                await Task.Delay(Delay);
            }
        }
    }
}
