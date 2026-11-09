using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;

namespace Admission.Api.Errors;

/// <summary>
/// Last line of defence: turns any exception that escapes an endpoint into a JSON
/// error body. Expected failures (validation, not found, conflicts) are returned by
/// the endpoints themselves and never reach this handler.
/// </summary>
public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (statusCode, error) = Map(exception);

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}",
                httpContext.Request.Method, httpContext.Request.Path);
        }
        else
        {
            logger.LogInformation("Rejected {Method} {Path}: {Message}",
                httpContext.Request.Method, httpContext.Request.Path, exception.Message);
        }

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(error, cancellationToken);
        return true;
    }

    internal static (int StatusCode, ApiError Error) Map(Exception exception) => exception switch
    {
        // Body is not valid JSON, or a value has the wrong type (e.g. "totalSeats": "abc").
        BadHttpRequestException { InnerException: JsonException } =>
            (StatusCodes.Status400BadRequest,
             new ApiError(ErrorCodes.InvalidJson,
                 "The request body is not valid JSON or a field has the wrong type.")),

        // Other request-binding failures: missing body, wrong content type, too large, ...
        BadHttpRequestException bad =>
            (bad.StatusCode, StatusCodeErrorBodies.ForStatus(bad.StatusCode)),

        _ => (StatusCodes.Status500InternalServerError,
              new ApiError(ErrorCodes.InternalError, "Something went wrong on the server. Please try again.")),
    };
}
