using Admission.Api.Errors;

namespace Admission.Api.Features.Classes;

public static class CreateClassValidator
{
    public const int MaxNameLength = 200;
    public const int MinSeats = 1;
    public const int MaxSeats = 10_000;

    /// <summary>
    /// Checks a create-class request. Returns null when it is valid, otherwise an
    /// <see cref="ApiError"/> with code <c>validation_failed</c> and a message naming the
    /// first problem found. The name is checked after trimming.
    /// </summary>
    public static ApiError? Validate(CreateClassRequest? request)
    {
        if (request is null)
        {
            return Invalid("Send a JSON body with \"name\" and \"totalSeats\".");
        }

        var name = request.Name?.Trim();
        if (string.IsNullOrEmpty(name))
        {
            return Invalid("Class name is required, e.g. \"Class 6 - Morning Shift\".");
        }

        if (name.Length > MaxNameLength)
        {
            return Invalid($"Class name must be at most {MaxNameLength} characters.");
        }

        if (request.TotalSeats is null)
        {
            return Invalid("Number of seats (totalSeats) is required.");
        }

        if (request.TotalSeats is < MinSeats or > MaxSeats)
        {
            return Invalid($"Number of seats must be between {MinSeats} and {MaxSeats:N0}.");
        }

        return null;
    }

    private static ApiError Invalid(string message) => new(ErrorCodes.ValidationFailed, message);
}
