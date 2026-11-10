using Admission.Api.Data;

namespace Admission.Api.Features.Holds;

/// <summary>
/// How often the background sweeper saves EXPIRED, from <c>EXPIRY_SWEEP_SECONDS</c>
/// (default 5 seconds). <c>0</c> switches the sweeper off; seats are still freed on time.
/// </summary>
public sealed record ExpirySweepSettings(TimeSpan Interval)
{
    public const string ConfigKey = "EXPIRY_SWEEP_SECONDS";
    public const int DefaultSeconds = 5;

    public bool Enabled => Interval > TimeSpan.Zero;

    public static ExpirySweepSettings FromConfiguration(IConfiguration configuration)
    {
        var raw = configuration[ConfigKey];
        if (string.IsNullOrWhiteSpace(raw))
        {
            return new ExpirySweepSettings(TimeSpan.FromSeconds(DefaultSeconds));
        }

        if (!int.TryParse(raw, out var seconds) || seconds < 0)
        {
            throw new InvalidOperationException(
                $"{ConfigKey} must be a whole number of seconds (0 switches the sweeper off), but was \"{raw}\".");
        }

        return new ExpirySweepSettings(TimeSpan.FromSeconds(seconds));
    }
}

/// <summary>
/// Runs <see cref="HoldExpiry.ExpirePastDueHoldsAsync"/> every few seconds for as long as
/// the API runs. A failed sweep (database briefly unreachable) is logged and retried on
/// the next tick; it never stops the API. Several backend processes may sweep the same
/// database at once; the UPDATE is safe to repeat.
/// </summary>
public sealed class HoldExpirySweeper(
    IServiceScopeFactory scopeFactory,
    ExpirySweepSettings settings,
    ILogger<HoldExpirySweeper> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!settings.Enabled)
        {
            logger.LogInformation("Expiry sweeper is off ({Key}=0)", ExpirySweepSettings.ConfigKey);
            return;
        }

        using var timer = new PeriodicTimer(settings.Interval);
        do
        {
            await SweepOnceAsync(stoppingToken);
        }
        while (await WaitForNextTickAsync(timer, stoppingToken));
    }

    private async Task SweepOnceAsync(CancellationToken stoppingToken)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
            var expired = await HoldExpiry.ExpirePastDueHoldsAsync(db, stoppingToken);
            if (expired > 0)
            {
                logger.LogInformation("Expiry sweeper marked {Count} hold(s) as EXPIRED", expired);
            }
        }
        catch (Exception exception) when (!stoppingToken.IsCancellationRequested)
        {
            logger.LogWarning(exception, "Expiry sweep failed; trying again in {Interval}", settings.Interval);
        }
    }

    private static async Task<bool> WaitForNextTickAsync(PeriodicTimer timer, CancellationToken stoppingToken)
    {
        try
        {
            return await timer.WaitForNextTickAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }
}
