using Admission.Api.Features.Holds;
using Microsoft.Extensions.Configuration;

namespace Admission.Tests;

public class HoldSettingsTests
{
    [Theory]
    [InlineData(null, 600)]
    [InlineData("", 600)]
    [InlineData("30", 30)]
    [InlineData("600", 600)]
    public void Reads_HOLD_DURATION_SECONDS_with_600_as_default(string? raw, int expectedSeconds)
    {
        var settings = HoldSettings.FromConfiguration(Configuration(raw));

        Assert.Equal(TimeSpan.FromSeconds(expectedSeconds), settings.Duration);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-5")]
    [InlineData("ten")]
    [InlineData("1.5")]
    public void Rejects_values_that_are_not_positive_whole_seconds(string raw)
    {
        var exception = Assert.Throws<InvalidOperationException>(() =>
            HoldSettings.FromConfiguration(Configuration(raw)));

        Assert.Contains(HoldSettings.ConfigKey, exception.Message);
    }

    private static IConfiguration Configuration(string? holdDuration) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [HoldSettings.ConfigKey] = holdDuration })
            .Build();
}
