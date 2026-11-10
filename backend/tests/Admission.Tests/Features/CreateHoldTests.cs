using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Admission.Api.Data;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Features.Classes;
using Admission.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Admission.Tests.Features;

public class CreateHoldTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    private const string StudentA = "20152691234567890";
    private const string StudentB = "20152691234567891";
    private const string StudentC = "20152691234567892";

    [Fact]
    public async Task Holds_a_seat_and_returns_201_with_contract_fields()
    {
        var classId = await CreateClassAsync(seats: 120);
        var before = DateTime.UtcNow;

        var response = await ApplyAsync(classId, StudentA);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(
            ["holdId", "classId", "studentId", "status", "expiresAt"],
            json.EnumerateObject().Select(p => p.Name));

        var holdId = json.GetProperty("holdId").GetString();
        Assert.StartsWith("h_", holdId);
        Assert.Equal(classId, json.GetProperty("classId").GetString());
        Assert.Equal(StudentA, json.GetProperty("studentId").GetString());
        Assert.Equal("HELD", json.GetProperty("status").GetString());
        Assert.Equal($"/holds/{holdId}", response.Headers.Location?.OriginalString);

        // Default HOLD_DURATION_SECONDS is 600; expiresAt is UTC with whole seconds.
        var expiresAtText = json.GetProperty("expiresAt").GetString()!;
        Assert.Matches(@"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$", expiresAtText);
        var expiresAt = json.GetProperty("expiresAt").GetDateTime().ToUniversalTime();
        Assert.InRange(expiresAt, before.AddSeconds(600 - 2), DateTime.UtcNow.AddSeconds(600 + 1));

        var seats = await Client.GetFromJsonAsync<ClassSummaryResponse>($"/classes/{classId}");
        Assert.Equal(1, seats!.HeldSeats);
        Assert.Equal(119, seats.AvailableSeats);
    }

    [Fact]
    public async Task Full_class_returns_409_class_full()
    {
        var classId = await CreateClassAsync(seats: 2);
        Assert.Equal(HttpStatusCode.Created, (await ApplyAsync(classId, StudentA)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await ApplyAsync(classId, StudentB)).StatusCode);

        var response = await ApplyAsync(classId, StudentC);

        await AssertErrorAsync(response, HttpStatusCode.Conflict, ErrorCodes.ClassFull);
        Assert.Equal(2, await CountHoldsAsync(classId));
    }

    [Fact]
    public async Task Confirmed_seats_also_count_as_taken()
    {
        var classId = await CreateClassAsync(seats: 1);
        await InsertHoldAsync(classId, StudentA, HoldStatus.Confirmed, TimeSpan.FromMinutes(-5));

        var response = await ApplyAsync(classId, StudentB);

        await AssertErrorAsync(response, HttpStatusCode.Conflict, ErrorCodes.ClassFull);
    }

    [Fact]
    public async Task Same_student_cannot_apply_twice_to_one_class()
    {
        var classId = await CreateClassAsync(seats: 10);
        Assert.Equal(HttpStatusCode.Created, (await ApplyAsync(classId, StudentA)).StatusCode);

        var response = await ApplyAsync(classId, StudentA);

        await AssertErrorAsync(response, HttpStatusCode.Conflict, ErrorCodes.AlreadyApplied);
        Assert.Equal(1, await CountHoldsAsync(classId));
    }

    [Fact]
    public async Task Student_with_confirmed_admission_cannot_apply_again()
    {
        var classId = await CreateClassAsync(seats: 10);
        await InsertHoldAsync(classId, StudentA, HoldStatus.Confirmed, TimeSpan.FromMinutes(-5));

        var response = await ApplyAsync(classId, StudentA);

        await AssertErrorAsync(response, HttpStatusCode.Conflict, ErrorCodes.AlreadyApplied);
    }

    [Fact]
    public async Task Same_student_may_hold_seats_in_different_classes()
    {
        var morning = await CreateClassAsync(seats: 10);
        var day = await CreateClassAsync(seats: 10);

        Assert.Equal(HttpStatusCode.Created, (await ApplyAsync(morning, StudentA)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await ApplyAsync(day, StudentA)).StatusCode);
    }

    [Theory]
    [InlineData(HoldStatus.Cancelled)]
    [InlineData(HoldStatus.Expired)]
    public async Task Student_may_apply_again_after_cancel_or_expiry(HoldStatus previous)
    {
        var classId = await CreateClassAsync(seats: 10);
        await InsertHoldAsync(classId, StudentA, previous, TimeSpan.FromMinutes(-1));

        var response = await ApplyAsync(classId, StudentA);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Own_hold_whose_time_ran_out_is_expired_and_student_may_apply_again()
    {
        var classId = await CreateClassAsync(seats: 10);
        var oldHoldId = await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromSeconds(-1));

        var response = await ApplyAsync(classId, StudentA);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var old = await Factory.WithDbAsync(db => db.Holds.SingleAsync(h => h.Id == oldHoldId));
        Assert.Equal(HoldStatus.Expired, old.Status);
    }

    [Fact]
    public async Task Hold_whose_time_ran_out_frees_its_seat()
    {
        var classId = await CreateClassAsync(seats: 1);
        await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromSeconds(-1));

        var response = await ApplyAsync(classId, StudentB);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_class_returns_404()
    {
        var response = await ApplyAsync("c_00000000000000000000000000000000", StudentA);

        await AssertErrorAsync(response, HttpStatusCode.NotFound, ErrorCodes.NotFound);
    }

    [Theory]
    [InlineData(null, ErrorCodes.StudentIdRequired)]
    [InlineData("", ErrorCodes.StudentIdRequired)]
    [InlineData("123", ErrorCodes.InvalidStudentId)]
    [InlineData("2015269123456789X", ErrorCodes.InvalidStudentId)]
    [InlineData("201526912345678901", ErrorCodes.InvalidStudentId)]
    public async Task Missing_or_invalid_student_id_returns_400_and_holds_nothing(string? studentId, string code)
    {
        var classId = await CreateClassAsync(seats: 10);

        var response = await ApplyAsync(classId, studentId);

        await AssertErrorAsync(response, HttpStatusCode.BadRequest, code);
        Assert.Equal(0, await CountHoldsAsync(classId));
    }

    [Fact]
    public async Task Database_rejects_a_second_active_hold_for_the_same_student()
    {
        // The unique index behind the 409 mapping, tested without the API's own check.
        var classId = await CreateClassAsync(seats: 10);
        await InsertHoldAsync(classId, StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10));

        var exception = await Assert.ThrowsAsync<DbUpdateException>(() =>
            InsertHoldAsync(classId, StudentA, HoldStatus.Confirmed, TimeSpan.FromMinutes(10)));

        var postgres = Assert.IsType<PostgresException>(exception.InnerException);
        Assert.Equal(PostgresErrorCodes.UniqueViolation, postgres.SqlState);
        Assert.Equal(AdmissionDbContext.ActiveHoldIndex, postgres.ConstraintName);
    }

    private async Task<string> CreateClassAsync(int seats)
    {
        var response = await Client.PostAsJsonAsync("/classes", new { name = $"Class {Guid.NewGuid():N}", totalSeats = seats });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreatedClassResponse>())!.Id;
    }

    private Task<HttpResponseMessage> ApplyAsync(string classId, string? studentId)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        if (studentId is not null)
        {
            request.Headers.Add("X-Student-Id", studentId);
        }
        return Client.SendAsync(request);
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
            };
            db.Holds.Add(hold);
            await db.SaveChangesAsync();
            return hold.Id;
        });

    private Task<int> CountHoldsAsync(string classId) =>
        Factory.WithDbAsync(db => db.Holds.CountAsync(h => h.ClassId == classId));

    private static async Task AssertErrorAsync(HttpResponseMessage response, HttpStatusCode status, string code)
    {
        Assert.Equal(status, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(code, error?.Error);
        Assert.False(string.IsNullOrWhiteSpace(error?.Message));
    }
}
