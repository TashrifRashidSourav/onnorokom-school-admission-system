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

/// <summary>
/// Response of <c>GET /holds/{holdId}</c>: <c>{ "holdId", "classId", "status", "expiresAt" }</c>.
/// </summary>
public sealed record HoldDetailsResponse(string HoldId, string ClassId, string Status, DateTime ExpiresAt);

/// <summary>
/// Response of <c>POST /holds/{holdId}/confirm</c>: <c>{ "holdId", "status" }</c>.
/// </summary>
public sealed record ConfirmedHoldResponse(string HoldId, string Status);

/// <summary>
/// One item of <c>GET /me/holds</c>:
/// <c>{ "holdId", "classId", "className", "status", "expiresAt" }</c>.
/// </summary>
public sealed record MyHoldResponse(string HoldId, string ClassId, string ClassName, string Status, DateTime ExpiresAt);
