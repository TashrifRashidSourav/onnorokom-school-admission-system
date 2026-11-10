using Admission.Api.Domain;

namespace Admission.Api.Features.Holds;

/// <summary>
/// Response of <c>POST /classes/{classId}/holds</c>:
/// <c>{ "holdId", "classId", "studentId", "status", "expiresAt" }</c>.
/// <c>expiresAt</c> is UTC with whole seconds, e.g. <c>2026-11-01T04:10:00Z</c>.
/// </summary>
public sealed record CreatedHoldResponse(
    string HoldId,
    string ClassId,
    string StudentId,
    string Status,
    DateTime ExpiresAt)
{
    public static CreatedHoldResponse From(Hold hold) =>
        new(hold.Id, hold.ClassId, hold.StudentId, hold.Status.ToApiString(), hold.ExpiresAt);
}
