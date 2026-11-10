using Admission.Api.Data;
using Admission.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Admission.Api.Features.Holds;

/// <summary>
/// Saves EXPIRED for held seats whose time ran out.
///
/// Correctness never waits for this: seat counts and every read already treat such a
/// hold as expired. Saving it keeps the stored status true for anyone reading the
/// database directly (reports, the admin, a backup), not only through the API.
/// </summary>
public static class HoldExpiry
{
    /// <summary>
    /// One <c>UPDATE ... WHERE status = 'HELD' AND expires_at &lt;= now()</c>, judged by
    /// the database clock that every backend process shares. Returns how many holds expired.
    ///
    /// Safe next to a confirm or cancel of the same hold, and with several backend
    /// processes sweeping at once: PostgreSQL waits for the row lock and checks the
    /// condition again, so a hold confirmed meanwhile is left alone, and a hold is
    /// expired only once.
    /// </summary>
    public static Task<int> ExpirePastDueHoldsAsync(AdmissionDbContext db, CancellationToken cancellationToken) =>
        db.Holds
            .Where(h => h.Status == HoldStatus.Held && h.ExpiresAt <= DateTime.UtcNow)
            .ExecuteUpdateAsync(set => set.SetProperty(h => h.Status, HoldStatus.Expired), cancellationToken);
}
