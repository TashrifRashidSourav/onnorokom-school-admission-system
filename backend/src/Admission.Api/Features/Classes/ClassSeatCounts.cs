using Admission.Api.Domain;

namespace Admission.Api.Features.Classes;

/// <summary>
/// Turns classes into <see cref="ClassSummaryResponse"/> rows with their seat counts,
/// computed in one SQL query.
/// </summary>
public static class ClassSeatCounts
{
    /// <summary>
    /// A seat is <b>held</b> by a <c>HELD</c> hold whose time has not run out, and
    /// <b>confirmed</b> by a <c>CONFIRMED</c> hold. A <c>HELD</c> row past its
    /// <c>expires_at</c> counts as free immediately, even before anything marks it EXPIRED.
    /// <para>
    /// <c>DateTime.UtcNow</c> is translated to PostgreSQL <c>now()</c>, so expiry is judged
    /// by the database clock, the same clock for every backend process.
    /// </para>
    /// </summary>
    public static IQueryable<ClassSummaryResponse> WithSeatCounts(this IQueryable<SchoolClass> classes) =>
        classes.Select(c => new
            {
                c.Id,
                c.Name,
                c.TotalSeats,
                c.CreatedAt,
                HeldSeats = c.Holds.Count(h => h.Status == HoldStatus.Held && h.ExpiresAt > DateTime.UtcNow),
                ConfirmedSeats = c.Holds.Count(h => h.Status == HoldStatus.Confirmed),
            })
            .OrderBy(c => c.CreatedAt)
            .ThenBy(c => c.Id)
            .Select(c => new ClassSummaryResponse(
                c.Id,
                c.Name,
                c.TotalSeats,
                c.HeldSeats,
                c.ConfirmedSeats,
                c.TotalSeats - c.HeldSeats - c.ConfirmedSeats));
}
