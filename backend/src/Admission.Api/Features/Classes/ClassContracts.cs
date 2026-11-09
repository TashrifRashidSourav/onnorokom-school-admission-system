using Admission.Api.Domain;

namespace Admission.Api.Features.Classes;

/// <summary>
/// Body of <c>POST /classes</c>: <c>{ "name": "Class 6 - Morning Shift", "totalSeats": 120 }</c>.
/// Both fields are nullable so a missing field is reported as a validation error
/// instead of silently becoming "" or 0.
/// </summary>
public sealed record CreateClassRequest(string? Name, int? TotalSeats);

/// <summary>
/// Response of <c>POST /classes</c>: <c>{ "id", "name", "totalSeats" }</c>, exactly as
/// the API contract specifies.
/// </summary>
public sealed record CreatedClassResponse(string Id, string Name, int TotalSeats)
{
    public static CreatedClassResponse From(SchoolClass schoolClass) =>
        new(schoolClass.Id, schoolClass.Name, schoolClass.TotalSeats);
}
