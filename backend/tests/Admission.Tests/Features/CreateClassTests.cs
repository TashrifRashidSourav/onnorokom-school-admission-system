using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Admission.Api.Errors;
using Admission.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Admission.Tests.Features;

public class CreateClassTests(PostgresApiFactory factory) : DatabaseTest(factory)
{
    [Fact]
    public async Task Creates_class_and_returns_201_with_contract_fields()
    {
        var response = await Client.PostAsJsonAsync("/classes",
            new { name = "Class 6 - Morning Shift", totalSeats = 120 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        var id = json.GetProperty("id").GetString();
        Assert.StartsWith("c_", id);
        Assert.Equal("Class 6 - Morning Shift", json.GetProperty("name").GetString());
        Assert.Equal(120, json.GetProperty("totalSeats").GetInt32());
        Assert.Equal($"/classes/{id}", response.Headers.Location?.OriginalString);

        var saved = await Factory.WithDbAsync(db => db.Classes.SingleAsync());
        Assert.Equal(id, saved.Id);
        Assert.Equal(120, saved.TotalSeats);
        Assert.True(saved.CreatedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async Task Trims_the_name()
    {
        var response = await Client.PostAsJsonAsync("/classes",
            new { name = "  Class 6 - Day Shift  ", totalSeats = 80 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var saved = await Factory.WithDbAsync(db => db.Classes.SingleAsync());
        Assert.Equal("Class 6 - Day Shift", saved.Name);
    }

    public static TheoryData<string> InvalidBodies => new()
    {
        """{ "totalSeats": 120 }""",                         // name missing
        """{ "name": "", "totalSeats": 120 }""",             // name empty
        """{ "name": "   ", "totalSeats": 120 }""",          // name only spaces
        $$"""{ "name": "{{new string('x', 201)}}", "totalSeats": 120 }""", // name too long
        """{ "name": "Class 6" }""",                         // seats missing
        """{ "name": "Class 6", "totalSeats": 0 }""",        // zero seats
        """{ "name": "Class 6", "totalSeats": -5 }""",       // negative seats
        """{ "name": "Class 6", "totalSeats": 10001 }""",    // too many seats
        """{}""",
    };

    [Theory]
    [MemberData(nameof(InvalidBodies))]
    public async Task Invalid_input_returns_400_validation_failed_and_saves_nothing(string body)
    {
        var response = await PostRawAsync(body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(ErrorCodes.ValidationFailed, error?.Error);
        Assert.False(string.IsNullOrWhiteSpace(error?.Message));
        Assert.Equal(0, await Factory.WithDbAsync(db => db.Classes.CountAsync()));
    }

    [Theory]
    [InlineData("""{ "name": "Class 6", "totalSeats": "many" }""")] // wrong type
    [InlineData("""{ "name": "Class 6", "totalSeats": 12.5 }""")]   // not an integer
    [InlineData("""{ "name": "Class 6", "totalSeats": 120""")]      // broken JSON
    [InlineData("not json at all")]
    public async Task Malformed_json_returns_400_invalid_json(string body)
    {
        var response = await PostRawAsync(body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(ErrorCodes.InvalidJson, error?.Error);
    }

    [Fact]
    public async Task Missing_body_returns_400_not_500()
    {
        var response = await Client.PostAsync("/classes",
            new StringContent("", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Non_json_content_type_returns_415()
    {
        var response = await Client.PostAsync("/classes",
            new StringContent("name=Class 6&totalSeats=120", Encoding.UTF8, "application/x-www-form-urlencoded"));

        Assert.Equal(HttpStatusCode.UnsupportedMediaType, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(ErrorCodes.UnsupportedMediaType, error?.Error);
    }

    private Task<HttpResponseMessage> PostRawAsync(string body) =>
        Client.PostAsync("/classes", new StringContent(body, Encoding.UTF8, "application/json"));
}
