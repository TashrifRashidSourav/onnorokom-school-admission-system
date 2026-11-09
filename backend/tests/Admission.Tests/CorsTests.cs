using System.Net;

namespace Admission.Tests;

public class CorsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Preflight_from_frontend_origin_is_allowed_with_student_id_header()
    {
        var response = await SendPreflightAsync("http://localhost:3000");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("http://localhost:3000",
            response.Headers.GetValues("Access-Control-Allow-Origin").Single());
        var allowedHeaders = string.Join(",", response.Headers.GetValues("Access-Control-Allow-Headers"));
        Assert.Contains("X-Student-Id", allowedHeaders, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Preflight_from_unknown_origin_is_not_allowed()
    {
        var response = await SendPreflightAsync("http://evil.example");

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    private Task<HttpResponseMessage> SendPreflightAsync(string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/health");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type,x-student-id");
        return factory.CreateClient().SendAsync(request);
    }
}
