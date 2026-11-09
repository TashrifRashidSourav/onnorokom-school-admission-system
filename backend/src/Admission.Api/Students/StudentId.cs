using Admission.Api.Errors;

namespace Admission.Api.Students;

/// <summary>
/// A student's identity: the 17-digit birth registration number sent in the
/// <c>X-Student-Id</c> header. There is no login; this value is the identity.
/// </summary>
public readonly record struct StudentId
{
    public const string HeaderName = "X-Student-Id";
    public const int Length = 17;

    private StudentId(string value) => Value = value;

    public string Value { get; }

    /// <summary>Accepts exactly 17 ASCII digits (surrounding spaces are trimmed).</summary>
    public static bool TryParse(string? raw, out StudentId studentId)
    {
        studentId = default;
        var value = raw?.Trim();

        if (value is null || value.Length != Length || !value.All(char.IsAsciiDigit))
        {
            return false;
        }

        studentId = new StudentId(value);
        return true;
    }

    public override string ToString() => Value;
}

public static class StudentIdHeader
{
    /// <summary>
    /// Reads and validates <c>X-Student-Id</c>. On failure <paramref name="error"/> is a
    /// ready-to-return 400 response and the endpoint should return it as is.
    /// </summary>
    public static bool TryGetStudentId(this HttpRequest request, out StudentId studentId, out IResult error)
    {
        var values = request.Headers[StudentId.HeaderName];

        if (values.Count == 0 || string.IsNullOrWhiteSpace(values[0]))
        {
            studentId = default;
            error = ApiResults.Error(StatusCodes.Status400BadRequest, ErrorCodes.StudentIdRequired,
                $"The {StudentId.HeaderName} header is required: enter the student's 17-digit birth registration number.");
            return false;
        }

        if (values.Count > 1 || !StudentId.TryParse(values[0], out studentId))
        {
            studentId = default;
            error = ApiResults.Error(StatusCodes.Status400BadRequest, ErrorCodes.InvalidStudentId,
                $"The {StudentId.HeaderName} header must be exactly {StudentId.Length} digits (the birth registration number).");
            return false;
        }

        error = Results.Empty;
        return true;
    }
}
