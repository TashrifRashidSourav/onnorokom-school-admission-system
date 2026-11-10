using System.Net;
using System.Net.Http.Json;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Features.Classes;
using Admission.Api.Features.Holds;
using Admission.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Admission.Tests.Features;

public class CancelHoldTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    private const string StudentA = "20152691234567890";
    private const string StudentB = "20152691234567891";

    [Fact]
    public async Task Cancels_a_held_seat_with_204_and_frees_the_seat()
    {
        var classId = await CreateClassAsync(seats: 1);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));
        Assert.Equal(0, (await SeatsAsync(classId)).AvailableSeats);

        var response = await CancelAsync(holdId, StudentA);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Empty(await response.Content.ReadAsByteArrayAsync());
        Assert.Equal(HoldStatus.Cancelled, (await LoadHoldAsync(holdId)).Status);
        var seats = await SeatsAsync(classId);
        Assert.Equal((0, 0, 1), (seats.HeldSeats, seats.ConfirmedSeats, seats.AvailableSeats));

        var details = await Client.GetFromJsonAsync<HoldDetailsResponse>($"/holds/{holdId}");
        Assert.Equal("CANCELLED", details!.Status);
    }

    [Fact]
    public async Task Freed_seat_can_be_taken_by_another_student_or_applied_for_again()
    {
        var classId = await CreateClassAsync(seats: 1);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));
        Assert.Equal(HttpStatusCode.Conflict, (await ApplyAsync(classId, StudentB)).StatusCode);

        await CancelAsync(holdId, StudentA);

        Assert.Equal(HttpStatusCode.Created, (await ApplyAsync(classId, StudentB)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await ApplyAsync(classId, StudentA)).StatusCode); // full again
    }

    [Fact]
    public async Task Student_can_apply_again_after_cancelling()
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));

        await CancelAsync(holdId, StudentA);

        Assert.Equal(HttpStatusCode.Created, (await ApplyAsync(classId, StudentA)).StatusCode);
    }

    [Theory]
    [InlineData(HoldStatus.Held)]
    [InlineData(HoldStatus.Confirmed)]
    public async Task Another_student_gets_403_and_the_hold_is_unchanged(HoldStatus stored)
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, stored, TimeSpan.FromMinutes(10));

        var response = await CancelAsync(holdId, StudentB);

        await AssertErrorAsync(response, HttpStatusCode.Forbidden, ErrorCodes.NotYourApplication);
        Assert.Equal(stored, (await LoadHoldAsync(holdId)).Status);
    }

    [Theory]
    [InlineData(HoldStatus.Confirmed, ErrorCodes.HoldConfirmed)]
    [InlineData(HoldStatus.Expired, ErrorCodes.HoldExpired)]
    [InlineData(HoldStatus.Cancelled, ErrorCodes.HoldCancelled)]
    public async Task Hold_that_is_not_held_returns_409_and_is_unchanged(HoldStatus stored, string code)
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, stored, TimeSpan.FromMinutes(10));

        var response = await CancelAsync(holdId, StudentA);

        await AssertErrorAsync(response, HttpStatusCode.Conflict, code);
        Assert.Equal(stored, (await LoadHoldAsync(holdId)).Status);
    }

    [Fact]
    public async Task Held_seat_past_its_expiry_returns_409_and_is_saved_as_expired()
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromSeconds(-1));

        var response = await CancelAsync(holdId, StudentA);

        await AssertErrorAsync(response, HttpStatusCode.Conflict, ErrorCodes.HoldExpired);
        Assert.Equal(HoldStatus.Expired, (await LoadHoldAsync(holdId)).Status);
    }

    [Fact]
    public async Task Cancel_and_confirm_at_the_same_moment_end_in_exactly_one_of_them()
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));

        var confirm = ConfirmAsync(holdId, StudentA);
        var cancel = CancelAsync(holdId, StudentA);
        var (confirmed, cancelled) = (await confirm, await cancel);

        // The hold row is locked, so whichever runs second sees the first one's result.
        var final = (await LoadHoldAsync(holdId)).Status;
        if (final == HoldStatus.Confirmed)
        {
            Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
            await AssertErrorAsync(cancelled, HttpStatusCode.Conflict, ErrorCodes.HoldConfirmed);
        }
        else
        {
            Assert.Equal(HoldStatus.Cancelled, final);
            Assert.Equal(HttpStatusCode.NoContent, cancelled.StatusCode);
            await AssertErrorAsync(confirmed, HttpStatusCode.Conflict, ErrorCodes.HoldCancelled);
        }
    }

    [Theory]
    [InlineData("h_00000000000000000000000000000000")]
    [InlineData("not-a-hold")]
    public async Task Unknown_hold_returns_404_not_found(string holdId)
    {
        var response = await CancelAsync(holdId, StudentA);

        await AssertErrorAsync(response, HttpStatusCode.NotFound, ErrorCodes.NotFound);
    }

    [Theory]
    [InlineData(null, ErrorCodes.StudentIdRequired)]
    [InlineData("123", ErrorCodes.InvalidStudentId)]
    public async Task Missing_or_invalid_student_id_returns_400_and_cancels_nothing(string? studentId, string code)
    {
        var classId = await CreateClassAsync(seats: 5);
        var holdId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));

        var response = await CancelAsync(holdId, studentId);

        await AssertErrorAsync(response, HttpStatusCode.BadRequest, code);
        Assert.Equal(HoldStatus.Held, (await LoadHoldAsync(holdId)).Status);
    }

    private async Task<string> CreateClassAsync(int seats)
    {
        var response = await Client.PostAsJsonAsync("/classes", new { name = "Class 8 - Morning Shift", totalSeats = seats });
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

    private Task<HttpResponseMessage> ApplyAsync(string classId, string studentId) =>
        SendAsync(HttpMethod.Post, $"/classes/{classId}/holds", studentId);

    private Task<HttpResponseMessage> ConfirmAsync(string holdId, string studentId) =>
        SendAsync(HttpMethod.Post, $"/holds/{holdId}/confirm", studentId);

    private Task<HttpResponseMessage> CancelAsync(string holdId, string? studentId) =>
        SendAsync(HttpMethod.Delete, $"/holds/{holdId}", studentId);

    private Task<HttpResponseMessage> SendAsync(HttpMethod method, string url, string? studentId)
    {
        var request = new HttpRequestMessage(method, url);
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
