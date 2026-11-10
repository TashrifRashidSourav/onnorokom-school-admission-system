namespace Admission.Api.Features.Holds;

/// <summary>
/// How long an application holds a seat. Comes from the <c>HOLD_DURATION_SECONDS</c>
/// environment variable (default 600 seconds = 10 minutes).
/// </summary>
public sealed record HoldSettings(TimeSpan Duration)
{
    public const string ConfigKey = "HOLD_DURATION_SECONDS";
    public const int DefaultSeconds = 600;

    public static HoldSettings FromConfiguration(IConfiguration configuration)
    {
        var raw = configuration[ConfigKey];
        if (string.IsNullOrWhiteSpace(raw))
        {
            return new HoldSettings(TimeSpan.FromSeconds(DefaultSeconds));
        }

        if (!int.TryParse(raw, out var seconds) || seconds <= 0)
        {
            throw new InvalidOperationException(
                $"{ConfigKey} must be a positive whole number of seconds, but was \"{raw}\".");
        }

        return new HoldSettings(TimeSpan.FromSeconds(seconds));
    }
}
