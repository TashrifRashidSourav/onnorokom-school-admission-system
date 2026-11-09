namespace Admission.Api.Domain;

/// <summary>
/// A student's application for a seat. It holds the seat until <see cref="ExpiresAt"/>;
/// paying the fee in time turns it into a confirmed admission.
/// </summary>
public class Hold
{
    public string Id { get; set; } = IdGenerator.NewHoldId();

    public required string ClassId { get; set; }

    public SchoolClass? Class { get; set; }

    /// <summary>17-digit birth registration number from the X-Student-Id header.</summary>
    public required string StudentId { get; set; }

    public HoldStatus Status { get; set; } = HoldStatus.Held;

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }
}
