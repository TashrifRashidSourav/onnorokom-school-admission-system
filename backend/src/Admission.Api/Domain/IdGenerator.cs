namespace Admission.Api.Domain;

/// <summary>
/// Opaque, non-guessable IDs with a type prefix, e.g. <c>c_3f2a…</c> for a class
/// and <c>h_9b1c…</c> for a hold. The prefix makes IDs readable in logs and URLs.
/// </summary>
public static class IdGenerator
{
    public const string ClassPrefix = "c_";
    public const string HoldPrefix = "h_";

    public static string NewClassId() => ClassPrefix + Guid.NewGuid().ToString("N");

    public static string NewHoldId() => HoldPrefix + Guid.NewGuid().ToString("N");
}
