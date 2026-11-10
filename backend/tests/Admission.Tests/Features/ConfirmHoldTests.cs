using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Features.Classes;
using Admission.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Admission.Tests.Features;

public class ConfirmHoldTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    private const string StudentA = "20152691234567890";
    private const string StudentB = "20152691234567891";

    [Fact]
    public async Task Confirms_a_held_seat_and_returns_200_with_contract_fields()
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));

        var response = await ConfirmAsync(holdId, StudentA);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(["holdId", "status"], json.EnumerateObject().Select(p => p.Name));
        Assert.Equal(holdId, json.GetProperty("holdId").GetString());
        Assert.Equal("CONFIRMED", json.GetProperty("status").GetString());

        var seats = await SeatsAsync(classId);
        Assert.Equal((0, 1, 4), (seats.HeldSeats, seats.ConfirmedSeats, seats.AvailableSeats));
        var stored = await LoadHoldAsync(holdId);
        Assert.NotNull(stored.ConfirmedAt);
    }

    [Fact]
    public async Task Confirm_twice_returns_200_both_times_and_counts_one_seat()
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));

        var first = await ConfirmAsync(holdId, StudentA);
        var confirmedAt = (await LoadHoldAsync(holdId)).ConfirmedAt;
        var second = await ConfirmAsync(holdId, StudentA);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal(await first.Content.ReadAsStringAsync(), await second.Content.ReadAsStringAsync());
        Assert.Equal(confirmedAt, (await LoadHoldAsync(holdId)).ConfirmedAt);

        var seats = await SeatsAsync(classId);
        Assert.Equal((0, 1, 4), (seats.HeldSeats, seats.ConfirmedSeats, seats.AvailableSeats));
    }

    [Fact]
    public async Task Parallel_confirms_of_one_hold_all_succeed_and_count_one_seat()
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));

        var responses = await Task.WhenAll(Enumerable.Range(0, 10).Select(_ => ConfirmAsync(holdId, StudentA)));

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
        var seats = await SeatsAsync(classId);
        Assert.Equal((0, 1, 4), (seats.HeldSeats, seats.ConfirmedSeats, seats.AvailableSeats));
    }

    [Theory]
    [InlineData(HoldStatus.Held)]
    [InlineData(HoldStatus.Confirmed)]
    public async Task Another_student_gets_403_and_the_hold_is_unchanged(HoldStatus stored)
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, stored, TimeSpan.FromMinutes(10));

        var response = await ConfirmAsync(holdId, StudentB);

        await AssertErrorAsync(response, HttpStatusCode.Forbidden, ErrorCodes.NotYourApplication);
        Assert.Equal(stored, (await LoadHoldAsync(holdId)).Status);
    }

    [Fact]
    public async Task Held_seat_past_its_expiry_returns_409_and_is_saved_as_expired()
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromSeconds(-1));

        var response = await ConfirmAsync(holdId, StudentA);

        await AssertErrorAsync(response, HttpStatusCode.Conflict, ErrorCodes.HoldExpired);
        var stored = await LoadHoldAsync(holdId);
        Assert.Equal(HoldStatus.Expired, stored.Status);
        Assert.Null(stored.ConfirmedAt);
        var seats = await SeatsAsync(classId);
        Assert.Equal((0, 0, 5), (seats.HeldSeats, seats.ConfirmedSeats, seats.AvailableSeats));
    }

    [Theory]
    [InlineData(HoldStatus.Expired, ErrorCodes.HoldExpired)]
    [InlineData(HoldStatus.Cancelled, ErrorCodes.HoldCancelled)]
    public async Task Ended_application_returns_409_and_stays_ended(HoldStatus stored, string code)
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, stored, TimeSpan.FromMinutes(10));

        var response = await ConfirmAsync(holdId, StudentA);

        await AssertErrorAsync(response, HttpStatusCode.Conflict, code);
        Assert.Equal(stored, (await LoadHoldAsync(holdId)).Status);
    }

    [Theory]
    [InlineData("h_00000000000000000000000000000000")]
    [InlineData("not-a-hold")]
    public async Task Unknown_hold_returns_404_not_found(string holdId)
    {
        var response = await ConfirmAsync(holdId, StudentA);

        await AssertErrorAsync(response, HttpStatusCode.NotFound, ErrorCodes.NotFound);
    }

    [Theory]
    [InlineData(null, ErrorCodes.StudentIdRequired)]
    [InlineData("123", ErrorCodes.InvalidStudentId)]
    public async Task Missing_or_invalid_student_id_returns_400_and_confirms_nothing(string? studentId, string code)
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));

        var response = await ConfirmAsync(holdId, studentId);

        await AssertErrorAsync(response, HttpStatusCode.BadRequest, code);
        Assert.Equal(HoldStatus.Held, (await LoadHoldAsync(holdId)).Status);
    }

    private async Task<string> CreateClassAsync(int seats)
    {
        var response = await Client.PostAsJsonAsync("/classes", new { name = "Class 7 - Day Shift", totalSeats = seats });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreatedClassResponse>())!.Id;
    }

    private Task<string> InsertHoldAsync(string classId, string studentId, HoldStatus status, TimeSpan expiresIn) =>
        Factory.WithDbAsync(async db =>
        {
            var hold = new Hold
            {
                ClassId = classId,
                StudentId = studentId,
                Status = status,
                ExpiresAt = DateTime.UtcNow.Add(expiresIn),
                ConfirmedAt = status == HoldStatus.Confirmed ? DateTime.UtcNow : null,
            };
            db.Holds.Add(hold);
            await db.SaveChangesAsync();
            return hold.Id;
        });

    private Task<Hold> LoadHoldAsync(string holdId) =>
        Factory.WithDbAsync(db => db.Holds.AsNoTracking().SingleAsync(h => h.Id == holdId));

    private async Task<ClassSummaryResponse> SeatsAsync(string classId) =>
        (await Client.GetFromJsonAsync<ClassSummaryResponse>($"/classes/{classId}"))!;

    private Task<HttpResponseMessage> ConfirmAsync(string holdId, string? studentId)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/holds/{holdId}/confirm");
        if (studentId is not null)
        {
            request.Headers.Add("X-Student-Id", studentId);
        }
        return Client.SendAsync(request);
    }

    private static async Task AssertErrorAsync(HttpResponseMessage response, HttpStatusCode status, string code)
    {
        Assert.Equal(status, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(code, error?.Error);
        Assert.False(string.IsNullOrWhiteSpace(error?.Message));
    }
}
