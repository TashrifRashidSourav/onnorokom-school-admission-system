using System.Net;
using System.Net.Http.Json;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Features.Classes;
using Admission.Api.Features.Holds;
using Admission.Tests.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Admission.Tests.Features;

public class HoldExpiryTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    private const string StudentA = "20152691234567890";
    private const string StudentB = "20152691234567891";

    [Fact]
    public async Task Expired_hold_frees_its_seat_and_cannot_be_confirmed()
    {
        // Real holds of one second, made and confirmed through the API.
        await using var shortHolds = Factory.WithWebHostBuilder(b => b.UseSetting(HoldSettings.ConfigKey, "1"));
        var client = shortHolds.CreateClient();
        var classId = await CreateClassAsync(client, seats: 1);
        var hold = await (await SendAsync(client, HttpMethod.Post, $"/classes/{classId}/holds", StudentA))
            .Content.ReadFromJsonAsync<CreatedHoldResponse>();
        Assert.Equal(0, (await SeatsAsync(client, classId)).AvailableSeats);

        await Task.Delay(TimeSpan.FromSeconds(1.5));

        // The seat is free again without any API call having expired the hold.
        var seats = await SeatsAsync(client, classId);
        Assert.Equal((0, 0, 1), (seats.HeldSeats, seats.ConfirmedSeats, seats.AvailableSeats));
        var details = await client.GetFromJsonAsync<HoldDetailsResponse>($"/holds/{hold!.HoldId}");
        Assert.Equal("EXPIRED", details!.Status);

        var confirm = await SendAsync(client, HttpMethod.Post, $"/holds/{hold.HoldId}/confirm", StudentA);
        Assert.Equal(HttpStatusCode.Conflict, confirm.StatusCode);
        Assert.Equal(ErrorCodes.HoldExpired, (await confirm.Content.ReadFromJsonAsync<ApiError>())?.Error);
        Assert.Equal(0, (await SeatsAsync(client, classId)).ConfirmedSeats);

        // Another student can take the freed seat.
        var other = await SendAsync(client, HttpMethod.Post, $"/classes/{classId}/holds", StudentB);
        Assert.Equal(HttpStatusCode.Created, other.StatusCode);
    }

    [Fact]
    public async Task Sweep_saves_EXPIRED_only_for_held_seats_past_their_time()
    {
        var pastDue = await InsertHoldAsync(HoldStatus.Held, TimeSpan.FromSeconds(-1));
        var running = await InsertHoldAsync(HoldStatus.Held, TimeSpan.FromMinutes(10));
        var confirmed = await InsertHoldAsync(HoldStatus.Confirmed, TimeSpan.FromSeconds(-1));
        var cancelled = await InsertHoldAsync(HoldStatus.Cancelled, TimeSpan.FromSeconds(-1));

        var expired = await Factory.WithDbAsync(db => HoldExpiry.ExpirePastDueHoldsAsync(db, CancellationToken.None));

        Assert.Equal(1, expired);
        Assert.Equal(HoldStatus.Expired, await StatusAsync(pastDue));
        Assert.Equal(HoldStatus.Held, await StatusAsync(running));
        Assert.Equal(HoldStatus.Confirmed, await StatusAsync(confirmed));
        Assert.Equal(HoldStatus.Cancelled, await StatusAsync(cancelled));

        // Sweeping again changes nothing.
        Assert.Equal(0, await Factory.WithDbAsync(db => HoldExpiry.ExpirePastDueHoldsAsync(db, CancellationToken.None)));
    }

    [Fact]
    public async Task Background_sweeper_saves_EXPIRED_without_any_api_call()
    {
        var holdId = await InsertHoldAsync(HoldStatus.Held, TimeSpan.FromSeconds(-1));

        await using var sweeping = Factory.WithWebHostBuilder(b => b.UseSetting(ExpirySweepSettings.ConfigKey, "1"));
        _ = sweeping.Server; // starts the app, and with it the sweeper

        var deadline = DateTime.UtcNow.AddSeconds(10);
        while (await StatusAsync(holdId) != HoldStatus.Expired && DateTime.UtcNow < deadline)
        {
            await Task.Delay(200);
        }
        Assert.Equal(HoldStatus.Expired, await StatusAsync(holdId));
    }

    [Theory]
    [InlineData(null, 5)]
    [InlineData("", 5)]
    [InlineData("0", 0)]
    [InlineData("30", 30)]
    public void Reads_EXPIRY_SWEEP_SECONDS_with_5_as_default_and_0_as_off(string? raw, int expectedSeconds)
    {
        var settings = ExpirySweepSettings.FromConfiguration(Configuration(raw));

        Assert.Equal(TimeSpan.FromSeconds(expectedSeconds), settings.Interval);
        Assert.Equal(expectedSeconds > 0, settings.Enabled);
    }

    [Theory]
    [InlineData("-1")]
    [InlineData("five")]
    [InlineData("2.5")]
    public void Rejects_sweep_intervals_that_are_not_whole_seconds(string raw)
    {
        var exception = Assert.Throws<InvalidOperationException>(() =>
            ExpirySweepSettings.FromConfiguration(Configuration(raw)));

        Assert.Contains(ExpirySweepSettings.ConfigKey, exception.Message);
    }

    private static IConfiguration Configuration(string? value) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [ExpirySweepSettings.ConfigKey] = value })
            .Build();

    /// <summary>Stores one of StudentA's holds directly, each in its own class.</summary>
    private Task<string> InsertHoldAsync(HoldStatus status, TimeSpan expiresIn) =>
        Factory.WithDbAsync(async db =>
        {
            var schoolClass = new SchoolClass { Name = $"Class 10 - {status}", TotalSeats = 5 };
            var hold = new Hold
            {
                ClassId = schoolClass.Id,
                StudentId = StudentA,
                Status = status,
                ExpiresAt = DateTime.UtcNow.Add(expiresIn),
            };
            db.Classes.Add(schoolClass);
            db.Holds.Add(hold);
            await db.SaveChangesAsync();
            return hold.Id;
        });

    private Task<HoldStatus> StatusAsync(string holdId) =>
        Factory.WithDbAsync(db => db.Holds.AsNoTracking().Where(h => h.Id == holdId).Select(h => h.Status).SingleAsync());

    private static async Task<string> CreateClassAsync(HttpClient client, int seats)
    {
        var response = await client.PostAsJsonAsync("/classes", new { name = "Class 6 - Morning Shift", totalSeats = seats });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreatedClassResponse>())!.Id;
    }

    private static async Task<ClassSummaryResponse> SeatsAsync(HttpClient client, string classId) =>
        (await client.GetFromJsonAsync<ClassSummaryResponse>($"/classes/{classId}"))!;

    private static Task<HttpResponseMessage> SendAsync(HttpClient client, HttpMethod method, string url, string studentId)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Add("X-Student-Id", studentId);
        return client.SendAsync(request);
    }
}
