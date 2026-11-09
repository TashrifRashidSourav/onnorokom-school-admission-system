using System.Net;
using System.Net.Http.Json;
using Admission.Api.Errors;

namespace Admission.Tests;

public class ErrorResponseTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Unknown_url_returns_json_404()
    {
        var response = await factory.CreateClient().GetAsync("/no-such-endpoint");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(ErrorCodes.NotFound, body?.Error);
        Assert.False(string.IsNullOrWhiteSpace(body?.Message));
    }

    [Fact]
    public async Task Wrong_method_returns_json_405()
    {
        var response = await factory.CreateClient().DeleteAsync("/health");

        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(ErrorCodes.MethodNotAllowed, body?.Error);
    }
}
