using Microsoft.AspNetCore.Diagnostics;

namespace Admission.Api.Errors;

public static class StatusCodeErrorBodies
{
    /// <summary>
    /// Gives framework-generated error responses (unknown URL, wrong method, ...)
    /// the same JSON body as our own errors. Runs only when the response has no body yet.
    /// </summary>
    public static IApplicationBuilder UseJsonStatusCodeBodies(this IApplicationBuilder app) =>
        app.UseStatusCodePages(async context =>
        {
            var response = context.HttpContext.Response;
            var error = ForStatus(response.StatusCode);
            await response.WriteAsJsonAsync(error);
        });

    internal static ApiError ForStatus(int statusCode) => statusCode switch
    {
        StatusCodes.Status404NotFound =>
            new(ErrorCodes.NotFound, "The requested resource does not exist."),
        StatusCodes.Status405MethodNotAllowed =>
            new(ErrorCodes.MethodNotAllowed, "This HTTP method is not supported for this URL."),
        StatusCodes.Status415UnsupportedMediaType =>
            new(ErrorCodes.UnsupportedMediaType, "Send the request body as JSON (Content-Type: application/json)."),
        >= 500 =>
            new(ErrorCodes.InternalError, "Something went wrong on the server. Please try again."),
        _ =>
            new(ErrorCodes.BadRequest, "The request could not be processed."),
    };
}
