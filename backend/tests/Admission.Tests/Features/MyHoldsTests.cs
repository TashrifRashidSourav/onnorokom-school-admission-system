using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Features.Classes;
using Admission.Api.Features.Holds;
using Admission.Tests.Infrastructure;

namespace Admission.Tests.Features;

public class MyHoldsTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    private const string StudentA = "20152691234567890";
    private const string StudentB = "20152691234567891";

    [Fact]
    public async Task Lists_only_this_students_holds_with_contract_fields_and_class_name()
    {
        var morning = await CreateClassAsync("Class 6 - Morning Shift");
        var day = await CreateClassAsync("Class 6 - Day Shift");
        var mine = await ApplyAsync(morning, StudentA);
        await ApplyAsync(day, StudentB);

        var response = await GetMyHoldsAsync(StudentA);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        var item = Assert.Single(items.EnumerateArray());
        Assert.Equal(
            ["holdId", "classId", "className", "status", "expiresAt"],
            item.EnumerateObject().Select(p => p.Name));
        Assert.Equal(mine.HoldId, item.GetProperty("holdId").GetString());
        Assert.Equal(morning, item.GetProperty("classId").GetString());
        Assert.Equal("Class 6 - Morning Shift", item.GetProperty("className").GetString());
        Assert.Equal("HELD", item.GetProperty("status").GetString());
        Assert.Matches(@"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$", item.GetProperty("expiresAt").GetString());
    }

    [Fact]
    public async Task Student_without_applications_gets_an_empty_list()
    {
        var classId = await CreateClassAsync("Class 7 - Morning Shift");
        await ApplyAsync(classId, StudentB);

        var response = await GetMyHoldsAsync(StudentA);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Lists_every_status_newest_first_with_past_due_holds_as_expired()
    {
        var start = DateTime.UtcNow.AddHours(-1);
        var cancelled = await InsertHoldAsync(HoldStatus.Cancelled, createdAt: start, expiresIn: TimeSpan.FromMinutes(10));
        var pastDue = await InsertHoldAsync(HoldStatus.Held, createdAt: start.AddMinutes(1), expiresIn: TimeSpan.FromSeconds(-1));
        var confirmed = await InsertHoldAsync(HoldStatus.Confirmed, createdAt: start.AddMinutes(2), expiresIn: TimeSpan.FromMinutes(10));
        var held = await InsertHoldAsync(HoldStatus.Held, createdAt: start.AddMinutes(3), expiresIn: TimeSpan.FromMinutes(10));

        var items = await (await GetMyHoldsAsync(StudentA)).Content.ReadFromJsonAsync<List<MyHoldResponse>>();

        Assert.Equal(
            [(held, "HELD"), (confirmed, "CONFIRMED"), (pastDue, "EXPIRED"), (cancelled, "CANCELLED")],
            items!.Select(h => (h.HoldId, h.Status)));
    }

    [Fact]
    public async Task Shows_a_new_application_at_the_top_after_applying()
    {
        var first = await CreateClassAsync("Class 6 - Morning Shift");
        var second = await CreateClassAsync("Class 7 - Morning Shift");
        await ApplyAsync(first, StudentA);
        var latest = await ApplyAsync(second, StudentA);

        var items = await (await GetMyHoldsAsync(StudentA)).Content.ReadFromJsonAsync<List<MyHoldResponse>>();

        Assert.Equal(2, items!.Count);
        Assert.Equal(latest.HoldId, items[0].HoldId);
    }

    [Theory]
    [InlineData(null, ErrorCodes.StudentIdRequired)]
    [InlineData("", ErrorCodes.StudentIdRequired)]
    [InlineData("123", ErrorCodes.InvalidStudentId)]
    [InlineData("2015269123456789X", ErrorCodes.InvalidStudentId)]
    public async Task Missing_or_invalid_student_id_returns_400(string? studentId, string code)
    {
        var response = await GetMyHoldsAsync(studentId);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(code, error?.Error);
        Assert.False(string.IsNullOrWhiteSpace(error?.Message));
    }

    private async Task<string> CreateClassAsync(string name)
    {
        var response = await Client.PostAsJsonAsync("/classes", new { name, totalSeats = 10 });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreatedClassResponse>())!.Id;
    }

    private async Task<CreatedHoldResponse> ApplyAsync(string classId, string studentId)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        request.Headers.Add("X-Student-Id", studentId);
        var response = await Client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreatedHoldResponse>())!;
    }

    /// <summary>
    /// Stores one of StudentA's holds directly, in its own class: a student may have only
    /// one HELD or CONFIRMED application per class.
    /// </summary>
    private Task<string> InsertHoldAsync(HoldStatus status, DateTime createdAt, TimeSpan expiresIn) =>
        Factory.WithDbAsync(async db =>
        {
            var schoolClass = new SchoolClass { Name = $"Class 9 - {status}", TotalSeats = 5 };
            var hold = new Hold
            {
                ClassId = schoolClass.Id,
                StudentId = StudentA,
                Status = status,
                CreatedAt = createdAt,
                ExpiresAt = DateTime.UtcNow.Add(expiresIn),
            };
            db.Classes.Add(schoolClass);
            db.Holds.Add(hold);
            await db.SaveChangesAsync();
            return hold.Id;
        });

    private Task<HttpResponseMessage> GetMyHoldsAsync(string? studentId) => Client.SendAsync(MyHoldsRequest(studentId));

    private static HttpRequestMessage MyHoldsRequest(string? studentId)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/me/holds");
        if (studentId is not null)
        {
            request.Headers.Add("X-Student-Id", studentId);
        }
        return request;
    }
}
