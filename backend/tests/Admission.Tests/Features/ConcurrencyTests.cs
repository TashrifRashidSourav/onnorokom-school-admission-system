using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Features.Classes;
using Admission.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Admission.Tests.Features;

/// <summary>
/// Many requests at the same moment against the real database: the seat rules must hold
/// no matter how the requests interleave. Requests are prepared first and released
/// together, so they really compete for the same rows.
/// </summary>
[Trait("Category", "Concurrency")]
public class ConcurrencyTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    [Fact]
    public async Task Two_hundred_students_apply_at_once_for_ten_seats_and_exactly_ten_get_one()
    {
        var classId = await CreateClassAsync(seats: 10);
        var students = Enumerable.Range(1, 200).Select(StudentId).ToList();

        var responses = await AllAtOnceAsync(students.Select(s => Request(HttpMethod.Post, $"/classes/{classId}/holds", s)));

        Assert.Equal(10, responses.Count(r => r.Status == HttpStatusCode.Created));
        Assert.Equal(190, responses.Count(r => r.Status == HttpStatusCode.Conflict));
        Assert.All(
            responses.Where(r => r.Status == HttpStatusCode.Conflict),
            r => Assert.Equal(ErrorCodes.ClassFull, r.ErrorCode));

        var seats = await SeatsAsync(classId);
        Assert.Equal((10, 0, 0), (seats.HeldSeats, seats.ConfirmedSeats, seats.AvailableSeats));
        Assert.Equal(10, await ActiveHoldsInDatabaseAsync(classId));
    }

    [Fact]
    public async Task One_student_applying_many_times_at_once_gets_exactly_one_seat()
    {
        // A double-clicked or repeated "Apply": 25 identical requests from one student.
        var classId = await CreateClassAsync(seats: 10);
        var student = StudentId(1);

        var responses = await AllAtOnceAsync(
            Enumerable.Range(0, 25).Select(_ => Request(HttpMethod.Post, $"/classes/{classId}/holds", student)));

        Assert.Equal(1, responses.Count(r => r.Status == HttpStatusCode.Created));
        Assert.Equal(24, responses.Count(r => r.Status == HttpStatusCode.Conflict));
        Assert.All(
            responses.Where(r => r.Status == HttpStatusCode.Conflict),
            r => Assert.Equal(ErrorCodes.AlreadyApplied, r.ErrorCode));

        var seats = await SeatsAsync(classId);
        Assert.Equal((1, 9), (seats.HeldSeats, seats.AvailableSeats));
        Assert.Equal(1, await ActiveHoldsInDatabaseAsync(classId));
    }

    [Fact]
    public async Task Duplicate_applications_mixed_with_other_students_still_give_one_seat_each()
    {
        // 10 students each send 5 applications at once for a 20-seat class.
        var classId = await CreateClassAsync(seats: 20);
        var students = Enumerable.Range(1, 10).Select(StudentId).ToList();

        var responses = await AllAtOnceAsync(students
            .SelectMany(s => Enumerable.Repeat(s, 5))
            .Select(s => Request(HttpMethod.Post, $"/classes/{classId}/holds", s)));

        Assert.Equal(10, responses.Count(r => r.Status == HttpStatusCode.Created));
        Assert.Equal(40, responses.Count(r => r.ErrorCode == ErrorCodes.AlreadyApplied));
        var perStudent = await Factory.WithDbAsync(db => db.Holds
            .Where(h => h.ClassId == classId)
            .GroupBy(h => h.StudentId)
            .Select(g => g.Count())
            .ToListAsync());
        Assert.Equal(10, perStudent.Count);
        Assert.All(perStudent, count => Assert.Equal(1, count));
    }

    private async Task<string> CreateClassAsync(int seats)
    {
        var response = await Client.PostAsJsonAsync("/classes", new { name = "Class 6 - Morning Shift", totalSeats = seats });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreatedClassResponse>())!.Id;
    }

    private async Task<ClassSummaryResponse> SeatsAsync(string classId) =>
        (await Client.GetFromJsonAsync<ClassSummaryResponse>($"/classes/{classId}"))!;

    /// <summary>HELD and CONFIRMED rows as stored, counted straight from the table.</summary>
    private Task<int> ActiveHoldsInDatabaseAsync(string classId) =>
        Factory.WithDbAsync(db => db.Holds.CountAsync(h =>
            h.ClassId == classId && (h.Status == HoldStatus.Held || h.Status == HoldStatus.Confirmed)));

    /// <summary>A distinct, valid 17-digit birth registration number per index.</summary>
    private static string StudentId(int index) => $"2015269{index:D10}";

    private static HttpRequestMessage Request(HttpMethod method, string url, string studentId)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Add("X-Student-Id", studentId);
        return request;
    }

    private sealed record Outcome(HttpStatusCode Status, string? ErrorCode, string Body);

    /// <summary>
    /// Sends every request at the same moment: each waits on one gate that opens only
    /// when all of them are ready. No response may be a 500.
    /// </summary>
    private async Task<IReadOnlyList<Outcome>> AllAtOnceAsync(IEnumerable<HttpRequestMessage> requests)
    {
        var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var sending = requests.Select(async request =>
        {
            await gate.Task;
            var response = await Client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            var code = response.IsSuccessStatusCode || body.Length == 0
                ? null
                : JsonSerializer.Deserialize<ApiError>(body, JsonOptions)?.Error;
            return new Outcome(response.StatusCode, code, body);
        }).ToList();

        gate.SetResult();
        var outcomes = await Task.WhenAll(sending);

        Assert.DoesNotContain(outcomes, o => (int)o.Status >= 500);
        return outcomes;
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
}
