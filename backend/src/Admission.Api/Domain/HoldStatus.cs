namespace Admission.Api.Domain;

/// <summary>
/// Lifecycle of a hold. Stored and returned in upper case
/// (HELD, CONFIRMED, EXPIRED, CANCELLED), as the API contract requires.
/// </summary>
public enum HoldStatus
{
    Held,
    Confirmed,
    Expired,
    Cancelled,
}
