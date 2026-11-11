using System.Net;
using System.Net.Http.Json;
using Admission.Api.Features.Classes;
using Admission.Api.Features.Holds;
using Admission.Tests.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Npgsql;

namespace Admission.Tests.Features;

/// <summary>
/// The seat rules must hold when several backend processes share one database.
///
/// By default the two "processes" are two separate app instances started in this test
/// run, each with its own services and its own connection pool, on the same database.
/// Set MULTI_BACKEND_URLS (e.g. "http://localhost:8080,http://localhost:8081" after
/// <c>docker compose --profile multi up -d</c>) to send the same requests to two real
/// backend containers instead.
/// </summary>
[Trait("Category", "MultiProcess")]
public class MultiProcessTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    public const string UrlsEnvVar = "MULTI_BACKEND_URLS";

    [Fact]
    public async Task Applications_split_across_two_processes_never_overbook_a_class()
    {
        await using var backends = await TwoBackendsAsync();
        var classId = await CreateClassAsync(backends.First, seats: 10);

        // 200 students apply at the same moment, every other one through each process.
        var responses = await AllAtOnceAsync(Enumerable.Range(1, 200).Select(i =>
            (i % 2 == 0 ? backends.First : backends.Second, Apply(classId, StudentId(i)))));

        Assert.Equal(10, responses.Count(r => r == HttpStatusCode.Created));
        Assert.Equal(190, responses.Count(r => r == HttpStatusCode.Conflict));

        // Both processes report the same, correct seat counts.
        foreach (var backend in new[] { backends.First, backends.Second })
        {
            var seats = await backend.GetFromJsonAsync<ClassSummaryResponse>($"/classes/{classId}");
            Assert.Equal((10, 0, 0), (seats!.HeldSeats, seats.ConfirmedSeats, seats.AvailableSeats));
        }
    }

    [Fact]
    public async Task One_student_applying_through_both_processes_at_once_gets_one_seat()
    {
        await using var backends = await TwoBackendsAsync();
        var classId = await CreateClassAsync(backends.First, seats: 10);
        var student = StudentId(1);

        var responses = await AllAtOnceAsync(Enumerable.Range(0, 20).Select(i =>
            (i % 2 == 0 ? backends.First : backends.Second, Apply(classId, student))));

        Assert.Equal(1, responses.Count(r => r == HttpStatusCode.Created));
        Assert.Equal(19, responses.Count(r => r == HttpStatusCode.Conflict));
        var seats = await backends.Second.GetFromJsonAsync<ClassSummaryResponse>($"/classes/{classId}");
        Assert.Equal(1, seats!.HeldSeats);
    }

    [Fact]
    public async Task Paying_through_both_processes_at_once_confirms_the_seat_once()
    {
        await using var backends = await TwoBackendsAsync();
        var classId = await CreateClassAsync(backends.First, seats: 10);
        var student = StudentId(1);
        var created = await backends.First.SendAsync(Apply(classId, student));
        var holdId = (await created.Content.ReadFromJsonAsync<CreatedHoldResponse>())!.HoldId;

        var responses = await AllAtOnceAsync(Enumerable.Range(0, 20).Select(i =>
            (i % 2 == 0 ? backends.First : backends.Second, Confirm(holdId, student))));

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r));
        var seats = await backends.First.GetFromJsonAsync<ClassSummaryResponse>($"/classes/{classId}");
        Assert.Equal((0, 1, 9), (seats!.HeldSeats, seats.ConfirmedSeats, seats.AvailableSeats));
    }

    /// <summary>Two clients, each talking to a different backend process.</summary>
    private sealed class TwoBackends(HttpClient first, HttpClient second, IAsyncDisposable? owned) : IAsyncDisposable
    {
        public HttpClient First { get; } = first;
        public HttpClient Second { get; } = second;

        public ValueTask DisposeAsync() => owned?.DisposeAsync() ?? ValueTask.CompletedTask;
    }

    /// <summary>
    /// Both backends, each already answering: a backend still starting up would take the
    /// burst one request at a time and hide a race, so each gets a few requests first.
    /// </summary>
    private async Task<TwoBackends> TwoBackendsAsync()
    {
        var backends = Connect();
        foreach (var backend in new[] { backends.First, backends.Second })
        {
            await Task.WhenAll(Enumerable.Range(0, 10).Select(_ => backend.GetAsync("/classes")));
        }
        return backends;
    }

    private TwoBackends Connect()
    {
        var urls = Environment.GetEnvironmentVariable(UrlsEnvVar)?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (urls is { Length: 2 })
        {
            return new TwoBackends(
                new HttpClient { BaseAddress = new Uri(urls[0]) },
                new HttpClient { BaseAddress = new Uri(urls[1]) },
                owned: null);
        }

        // A second app instance on the same database, with its own connection pool
        // (a different Application Name gives Npgsql a separate pool).
        var connection = new NpgsqlConnectionStringBuilder(PostgresApiFactory.WithSmallPool(PostgresApiFactory.ConnectionString))
        {
            ApplicationName = "second-backend",
        }.ConnectionString;
        var second = Factory.WithWebHostBuilder(b => b.UseSetting("ConnectionStrings:Default", connection));
        return new TwoBackends(Client, second.CreateClient(), second);
    }

    private static async Task<string> CreateClassAsync(HttpClient client, int seats)
    {
        var response = await client.PostAsJsonAsync("/classes", new { name = "Class 6 - Morning Shift", totalSeats = seats });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreatedClassResponse>())!.Id;
    }

    /// <summary>A distinct, valid 17-digit birth registration number per index.</summary>
    private static string StudentId(int index) => $"2015269{index:D10}";

    private static HttpRequestMessage Apply(string classId, string studentId) =>
        WithStudent(new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds"), studentId);

    private static HttpRequestMessage Confirm(string holdId, string studentId) =>
        WithStudent(new HttpRequestMessage(HttpMethod.Post, $"/holds/{holdId}/confirm"), studentId);

    private static HttpRequestMessage WithStudent(HttpRequestMessage request, string studentId)
    {
        request.Headers.Add("X-Student-Id", studentId);
        return request;
    }

    /// <summary>Releases every request at the same moment; none may be a 500.</summary>
    private static async Task<HttpStatusCode[]> AllAtOnceAsync(IEnumerable<(HttpClient Client, HttpRequestMessage Request)> requests)
    {
        var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var sending = requests.Select(async pair =>
        {
            await gate.Task;
            return (await pair.Client.SendAsync(pair.Request)).StatusCode;
        }).ToList();

        gate.SetResult();
        var statuses = await Task.WhenAll(sending);
        Assert.DoesNotContain(statuses, s => (int)s >= 500);
        return statuses;
    }
}
