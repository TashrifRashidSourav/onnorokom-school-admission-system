using System.Net;
using System.Net.Http.Json;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Features.Classes;
using Admission.Tests.Infrastructure;

namespace Admission.Tests.Features;

public class ClassSeatCountTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    private const string StudentA = "20152691234567890";
    private const string StudentB = "20152691234567891";
    private const string StudentC = "20152691234567892";
    private const string StudentD = "20152691234567893";
    private const string StudentE = "20152691234567894";

    [Fact]
    public async Task List_is_empty_when_no_classes_exist()
    {
        var classes = await Client.GetFromJsonAsync<List<ClassSummaryResponse>>("/classes");

        Assert.NotNull(classes);
        Assert.Empty(classes);
    }

    [Fact]
    public async Task New_class_has_all_seats_available()
    {
        var id = await CreateClassAsync("Class 6 - Morning Shift", 120);

        var summary = await Client.GetFromJsonAsync<ClassSummaryResponse>($"/classes/{id}");

        Assert.Equal(new ClassSummaryResponse(id, "Class 6 - Morning Shift", 120, 0, 0, 120), summary);
    }

    [Fact]
    public async Task Response_uses_the_contract_field_names()
    {
        var id = await CreateClassAsync("Class 6 - Day Shift", 80);

        var json = await Client.GetStringAsync($"/classes/{id}");

        Assert.Equal(
            $$"""{"id":"{{id}}","name":"Class 6 - Day Shift","totalSeats":80,"heldSeats":0,"confirmedSeats":0,"availableSeats":80}""",
            json);
    }

    [Fact]
    public async Task Counts_held_and_confirmed_seats_and_ignores_expired_and_cancelled()
    {
        var id = await CreateClassAsync("Class 7 - Morning Shift", 10);
        await AddHoldsAsync(id,
            (StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10)),      // held
            (StudentB, HoldStatus.Held, TimeSpan.FromMinutes(5)),       // held
            (StudentC, HoldStatus.Confirmed, TimeSpan.FromMinutes(-1)), // confirmed (expiry no longer matters)
            (StudentD, HoldStatus.Held, TimeSpan.FromSeconds(-1)),      // HELD but time ran out: free
            (StudentE, HoldStatus.Cancelled, TimeSpan.FromMinutes(10))); // cancelled: free

        var summary = await Client.GetFromJsonAsync<ClassSummaryResponse>($"/classes/{id}");

        Assert.Equal(new ClassSummaryResponse(id, "Class 7 - Morning Shift", 10, 2, 1, 7), summary);
    }

    [Fact]
    public async Task List_returns_every_class_oldest_first_with_its_own_counts()
    {
        var first = await CreateClassAsync("Class 6 - Morning Shift", 120);
        var second = await CreateClassAsync("Class 6 - Day Shift", 3);
        await AddHoldsAsync(second,
            (StudentA, HoldStatus.Held, TimeSpan.FromMinutes(10)),
            (StudentB, HoldStatus.Confirmed, TimeSpan.FromMinutes(10)));

        var classes = await Client.GetFromJsonAsync<List<ClassSummaryResponse>>("/classes");

        Assert.Equal(
            [
                new ClassSummaryResponse(first, "Class 6 - Morning Shift", 120, 0, 0, 120),
                new ClassSummaryResponse(second, "Class 6 - Day Shift", 3, 1, 1, 1),
            ],
            classes);
    }

    [Theory]
    [InlineData("c_00000000000000000000000000000000")]
    [InlineData("not-a-class")]
    public async Task Unknown_class_returns_404_not_found(string id)
    {
        var response = await Client.GetAsync($"/classes/{id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(ErrorCodes.NotFound, error?.Error);
        Assert.False(string.IsNullOrWhiteSpace(error?.Message));
    }

    private async Task<string> CreateClassAsync(string name, int totalSeats)
    {
        var response = await Client.PostAsJsonAsync("/classes", new { name, totalSeats });
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<CreatedClassResponse>();
        return created!.Id;
    }

    /// <summary>Inserts holds directly; the endpoints that create them come in later steps.</summary>
    private Task AddHoldsAsync(string classId, params (string Student, HoldStatus Status, TimeSpan ExpiresIn)[] holds) =>
        Factory.WithDbAsync(db =>
        {
            foreach (var (student, status, expiresIn) in holds)
            {
                db.Holds.Add(new Hold
                {
                    ClassId = classId,
                    StudentId = student,
                    Status = status,
                    ExpiresAt = DateTime.UtcNow.Add(expiresIn),
                    ConfirmedAt = status == HoldStatus.Confirmed ? DateTime.UtcNow : null,
                });
            }

            return db.SaveChangesAsync();
        });
}
