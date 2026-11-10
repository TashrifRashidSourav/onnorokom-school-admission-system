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

public static class HoldStatusText
{
    /// <summary>The status as the API returns it, e.g. <c>HELD</c>.</summary>
    public static string ToApiString(this HoldStatus status) => status.ToString().ToUpperInvariant();
}
