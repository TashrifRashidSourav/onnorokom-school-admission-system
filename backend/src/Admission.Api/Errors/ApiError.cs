namespace Admission.Api.Errors;

/// <summary>
/// Body of every error response: <c>{ "error": "&lt;code&gt;", "message": "&lt;text&gt;" }</c>.
/// <see cref="Error"/> is a stable machine-readable code the UI maps to its own wording;
/// <see cref="Message"/> is a plain-language explanation.
/// </summary>
public sealed record ApiError(string Error, string Message);

/// <summary>Stable error codes. Clients may rely on these strings.</summary>
public static class ErrorCodes
{
    public const string BadRequest = "bad_request";
    public const string InvalidJson = "invalid_json";
    public const string ValidationFailed = "validation_failed";
    public const string StudentIdRequired = "student_id_required";
    public const string InvalidStudentId = "invalid_student_id";
    public const string NotFound = "not_found";
    public const string ClassFull = "class_full";
    public const string AlreadyApplied = "already_applied";
    public const string MethodNotAllowed = "method_not_allowed";
    public const string UnsupportedMediaType = "unsupported_media_type";
    public const string InternalError = "internal_error";
}

public static class ApiResults
{
    public static IResult Error(int statusCode, string code, string message) =>
        Results.Json(new ApiError(code, message), statusCode: statusCode);
}
