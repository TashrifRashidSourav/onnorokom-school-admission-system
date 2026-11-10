using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Features.Classes;
using Admission.Api.Features.Holds;
using Admission.Tests.Infrastructure;

namespace Admission.Tests.Features;

public class HoldStatusTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    private const string StudentA = "20152691234567890";

    [Fact]
    public async Task Returns_the_hold_with_contract_fields_and_no_student_id_header()
    {
        var classId = await CreateClassAsync();
        var created = await ApplyAsync(classId);

        var response = await Client.GetAsync($"/holds/{created.HoldId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(["holdId", "classId", "status", "expiresAt"], json.EnumerateObject().Select(p => p.Name));
        Assert.Equal(created.HoldId, json.GetProperty("holdId").GetString());
        Assert.Equal(classId, json.GetProperty("classId").GetString());
        Assert.Equal("HELD", json.GetProperty("status").GetString());
        Assert.Equal(created.ExpiresAt, json.GetProperty("expiresAt").GetDateTime().ToUniversalTime());
    }

    [Theory]
    [InlineData(HoldStatus.Held, 10, "HELD")]
    [InlineData(HoldStatus.Held, -1, "EXPIRED")]       // time ran out, not yet saved as EXPIRED
    [InlineData(HoldStatus.Confirmed, -10, "CONFIRMED")] // paid in time; later expiry is irrelevant
    [InlineData(HoldStatus.Cancelled, 10, "CANCELLED")]
    [InlineData(HoldStatus.Expired, -10, "EXPIRED")]
    public async Task Reports_the_current_status(HoldStatus stored, int expiresInSeconds, string expected)
    {
        var classId = await CreateClassAsync();
        var holdId = await Factory.WithDbAsync(async db =>
        {
            var hold = new Hold
            {
                ClassId = classId,
                StudentId = StudentA,
                Status = stored,
                ExpiresAt = DateTime.UtcNow.AddSeconds(expiresInSeconds),
            };
            db.Holds.Add(hold);
            await db.SaveChangesAsync();
            return hold.Id;
        });

        var details = await Client.GetFromJsonAsync<HoldDetailsResponse>($"/holds/{holdId}");

        Assert.Equal(expected, details!.Status);
    }

    [Theory]
    [InlineData("h_00000000000000000000000000000000")]
    [InlineData("not-a-hold")]
    public async Task Unknown_hold_returns_404_not_found(string holdId)
    {
        var response = await Client.GetAsync($"/holds/{holdId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(ErrorCodes.NotFound, error?.Error);
        Assert.False(string.IsNullOrWhiteSpace(error?.Message));
    }

    private async Task<string> CreateClassAsync()
    {
        var response = await Client.PostAsJsonAsync("/classes", new { name = "Class 6 - Morning Shift", totalSeats = 10 });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreatedClassResponse>())!.Id;
    }

    private async Task<CreatedHoldResponse> ApplyAsync(string classId)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        request.Headers.Add("X-Student-Id", StudentA);
        var response = await Client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreatedHoldResponse>())!;
    }
}
