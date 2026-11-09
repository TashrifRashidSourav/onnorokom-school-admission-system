using System.Text.Json;
using Admission.Api.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace Admission.Tests;

public class ApiExceptionHandlerTests
{
    [Fact]
    public async Task Unexpected_exception_becomes_json_500_without_details()
    {
        var handler = new ApiExceptionHandler(NullLogger<ApiExceptionHandler>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var handled = await handler.TryHandleAsync(
            context, new InvalidOperationException("secret internal detail"), CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);

        context.Response.Body.Position = 0;
        var body = await JsonSerializer.DeserializeAsync<ApiError>(
            context.Response.Body, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.Equal(ErrorCodes.InternalError, body?.Error);
        Assert.DoesNotContain("secret", body?.Message);
    }

    [Fact]
    public void Malformed_json_body_maps_to_400_invalid_json()
    {
        var exception = new BadHttpRequestException(
            "Failed to read parameter", StatusCodes.Status400BadRequest, new JsonException("bad token"));

        var (status, error) = ApiExceptionHandler.Map(exception);

        Assert.Equal(StatusCodes.Status400BadRequest, status);
        Assert.Equal(ErrorCodes.InvalidJson, error.Error);
    }

    [Fact]
    public void Wrong_content_type_maps_to_415()
    {
        var exception = new BadHttpRequestException(
            "Expected a supported JSON media type", StatusCodes.Status415UnsupportedMediaType);

        var (status, error) = ApiExceptionHandler.Map(exception);

        Assert.Equal(StatusCodes.Status415UnsupportedMediaType, status);
        Assert.Equal(ErrorCodes.UnsupportedMediaType, error.Error);
    }

    [Fact]
    public void Other_bad_request_maps_to_400()
    {
        var exception = new BadHttpRequestException("Missing body", StatusCodes.Status400BadRequest);

        var (status, error) = ApiExceptionHandler.Map(exception);

        Assert.Equal(StatusCodes.Status400BadRequest, status);
        Assert.Equal(ErrorCodes.BadRequest, error.Error);
    }
}
