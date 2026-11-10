using Admission.Api.Data;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Students;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Admission.Api.Features.Holds;

public static class HoldEndpoints
{
    public static IEndpointRouteBuilder MapHoldEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/classes/{classId}/holds", CreateHoldAsync);
        app.MapGet("/holds/{holdId}", GetHoldAsync);
        app.MapPost("/holds/{holdId}/confirm", ConfirmHoldAsync);
        app.MapDelete("/holds/{holdId}", CancelHoldAsync);
        app.MapGet("/me/holds", GetMyHoldsAsync);

        return app;
    }

    /// <summary>
    /// POST /holds/{holdId}/confirm: the student pays the fee (simulated) and the held
    /// seat becomes a confirmed admission. The seat was already counted while held, so
    /// confirming does not change how many seats are taken.
    /// </summary>
    private static async Task<IResult> ConfirmHoldAsync(
        string holdId,
        HttpRequest request,
        AdmissionDbContext db,
        CancellationToken cancellationToken)
    {
        if (!request.TryGetStudentId(out var studentId, out var studentIdError))
        {
            return studentIdError;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        var hold = await LockHoldAsync(db, holdId, cancellationToken);
        if (hold is null)
        {
            return HoldNotFound();
        }

        // Only the student who applied may pay. Checked before the status, so a stranger
        // learns nothing about someone else's application.
        if (hold.StudentId != studentId.Value)
        {
            return NotYourApplication();
        }

        var now = await DatabaseNowAsync(db, cancellationToken);
        if (await ExpireIfPastDueAsync(db, hold, now, cancellationToken))
        {
            await transaction.CommitAsync(cancellationToken);
            return HoldExpired();
        }

        switch (hold.Status)
        {
            // Paying twice (a double click, a retried request) is not an error: answer
            // exactly as the first time and change nothing, so the seat is counted once.
            case HoldStatus.Confirmed:
                return Results.Ok(new ConfirmedHoldResponse(hold.Id, hold.Status.ToApiString()));
            case HoldStatus.Expired:
                return HoldExpired();
            case HoldStatus.Cancelled:
                return HoldCancelled();
        }

        hold.Status = HoldStatus.Confirmed;
        hold.ConfirmedAt = now;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Results.Ok(new ConfirmedHoldResponse(hold.Id, hold.Status.ToApiString()));
    }

    /// <summary>
    /// DELETE /holds/{holdId}: the student withdraws the application. The held seat is
    /// free for others at once. Returns 204 with no body.
    /// </summary>
    private static async Task<IResult> CancelHoldAsync(
        string holdId,
        HttpRequest request,
        AdmissionDbContext db,
        CancellationToken cancellationToken)
    {
        if (!request.TryGetStudentId(out var studentId, out var studentIdError))
        {
            return studentIdError;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        var hold = await LockHoldAsync(db, holdId, cancellationToken);
        if (hold is null)
        {
            return HoldNotFound();
        }

        if (hold.StudentId != studentId.Value)
        {
            return NotYourApplication();
        }

        var now = await DatabaseNowAsync(db, cancellationToken);
        if (await ExpireIfPastDueAsync(db, hold, now, cancellationToken))
        {
            await transaction.CommitAsync(cancellationToken);
            return HoldExpired();
        }

        // Only a seat that is still held can be given back. A paid admission stays: a
        // refund flow is out of scope.
        switch (hold.Status)
        {
            case HoldStatus.Confirmed:
                return AlreadyConfirmed();
            case HoldStatus.Expired:
                return HoldExpired();
            case HoldStatus.Cancelled:
                return AlreadyCancelled();
        }

        hold.Status = HoldStatus.Cancelled;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Results.NoContent();
    }

    /// <summary>
    /// Loads a hold and locks its row until the transaction ends. A confirm, a cancel or
    /// the expiry sweeper touching the same hold at the same moment, from any backend
    /// process, waits for the first one to finish, so they never overwrite each other.
    /// </summary>
    private static Task<Hold?> LockHoldAsync(AdmissionDbContext db, string holdId, CancellationToken cancellationToken) =>
        db.Holds
            .FromSql($"SELECT * FROM holds WHERE id = {holdId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// A HELD hold whose time ran out is expired even if the sweeper has not saved that
    /// yet. Saves it as EXPIRED, so the seat it held is free for everyone from this moment.
    /// </summary>
    private static async Task<bool> ExpireIfPastDueAsync(
        AdmissionDbContext db, Hold hold, DateTime now, CancellationToken cancellationToken)
    {
        if (hold.Status != HoldStatus.Held || hold.ExpiresAt > now)
        {
            return false;
        }

        hold.Status = HoldStatus.Expired;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// POST /classes/{classId}/holds: a student applies for a seat. If a seat is free it is
    /// held for the student until <c>expiresAt</c>; otherwise 409 <c>class_full</c>.
    /// </summary>
    private static async Task<IResult> CreateHoldAsync(
        string classId,
        HttpRequest request,
        AdmissionDbContext db,
        HoldSettings settings,
        CancellationToken cancellationToken)
    {
        if (!request.TryGetStudentId(out var studentId, out var studentIdError))
        {
            return studentIdError;
        }

        // One transaction per application. Locking the class row makes concurrent
        // applications for the same class, from any backend process, run one after
        // another, so the seat check and the insert can never interleave (no overbooking).
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        var lockedClass = await db.Database
            .SqlQuery<int>($"SELECT total_seats AS \"Value\" FROM classes WHERE id = {classId} FOR UPDATE")
            .ToListAsync(cancellationToken);
        if (lockedClass.Count == 0)
        {
            return ClassNotFound();
        }
        var totalSeats = lockedClass[0];

        // Read the clock after the lock is granted: waiting for the lock must not
        // make an expired hold look active, nor shorten the new hold.
        var now = await DatabaseNowAsync(db, cancellationToken);

        // Holds whose time ran out free their seat now, even before the background
        // sweeper gets to them. This also lets a student apply again after an expiry.
        await db.Holds
            .Where(h => h.ClassId == classId && h.Status == HoldStatus.Held && h.ExpiresAt <= now)
            .ExecuteUpdateAsync(set => set.SetProperty(h => h.Status, HoldStatus.Expired), cancellationToken);

        // One active application (HELD or CONFIRMED) per student per class.
        var alreadyApplied = await db.Holds.AnyAsync(h => h.ClassId == classId
            && h.StudentId == studentId.Value
            && (h.Status == HoldStatus.Held || h.Status == HoldStatus.Confirmed),
            cancellationToken);
        if (alreadyApplied)
        {
            return AlreadyApplied();
        }

        // Every remaining HELD hold is still running, so these two statuses are the taken seats.
        var takenSeats = await db.Holds.CountAsync(h => h.ClassId == classId
            && (h.Status == HoldStatus.Held || h.Status == HoldStatus.Confirmed),
            cancellationToken);
        if (takenSeats >= totalSeats)
        {
            return ClassFull();
        }

        var hold = new Hold
        {
            ClassId = classId,
            StudentId = studentId.Value,
            Status = HoldStatus.Held,
            ExpiresAt = WholeSeconds(now + settings.Duration),
        };
        db.Holds.Add(hold);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsDuplicateActiveHold(exception))
        {
            // Second line of defence: the unique index caught a duplicate that slipped past
            // the check above. Answer like the check would, never with a 500.
            return AlreadyApplied();
        }
        await transaction.CommitAsync(cancellationToken);

        return Results.Created($"/holds/{hold.Id}", CreatedHoldResponse.From(hold));
    }

    private static bool IsDuplicateActiveHold(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: AdmissionDbContext.ActiveHoldIndex,
        };

    /// <summary>
    /// GET /holds/{holdId}: current status of an application. Needs no X-Student-Id:
    /// the API contract does not list it, and the hold id itself is not guessable.
    /// </summary>
    private static async Task<IResult> GetHoldAsync(
        string holdId, AdmissionDbContext db, CancellationToken cancellationToken)
    {
        // PastDue is decided by the database clock (DateTime.UtcNow becomes now()).
        var hold = await db.Holds.AsNoTracking()
            .Where(h => h.Id == holdId)
            .Select(h => new { h.Id, h.ClassId, h.Status, h.ExpiresAt, PastDue = h.ExpiresAt <= DateTime.UtcNow })
            .SingleOrDefaultAsync(cancellationToken);

        if (hold is null)
        {
            return HoldNotFound();
        }

        // A HELD hold whose time ran out is EXPIRED the moment it runs out, even if the
        // background sweeper has not saved that yet; its seat is already free.
        var status = hold.Status == HoldStatus.Held && hold.PastDue ? HoldStatus.Expired : hold.Status;

        return Results.Ok(new HoldDetailsResponse(hold.Id, hold.ClassId, status.ToApiString(), hold.ExpiresAt));
    }

    /// <summary>
    /// GET /me/holds: every application of the student in X-Student-Id, in any status,
    /// with the class name so the list reads without another request per row.
    /// </summary>
    private static async Task<IResult> GetMyHoldsAsync(
        HttpRequest request, AdmissionDbContext db, CancellationToken cancellationToken)
    {
        if (!request.TryGetStudentId(out var studentId, out var studentIdError))
        {
            return studentIdError;
        }

        // PastDue is decided by the database clock (DateTime.UtcNow becomes now()).
        var holds = await db.Holds.AsNoTracking()
            .Where(h => h.StudentId == studentId.Value)
            .Select(h => new
            {
                h.Id,
                h.ClassId,
                ClassName = h.Class!.Name,
                h.Status,
                h.ExpiresAt,
                PastDue = h.ExpiresAt <= DateTime.UtcNow,
            })
            .ToListAsync(cancellationToken);

        // Same rule as GET /holds/{holdId}: a HELD hold whose time ran out is EXPIRED.
        return Results.Ok(holds.Select(h => new MyHoldResponse(
            h.Id,
            h.ClassId,
            h.ClassName,
            (h.Status == HoldStatus.Held && h.PastDue ? HoldStatus.Expired : h.Status).ToApiString(),
            h.ExpiresAt)));
    }

    /// <summary>
    /// The database clock, which every backend process shares. <c>clock_timestamp()</c> is
    /// the real current time; <c>now()</c> would be frozen at the start of the transaction.
    /// </summary>
    private static async Task<DateTime> DatabaseNowAsync(AdmissionDbContext db, CancellationToken cancellationToken) =>
        (await db.Database.SqlQuery<DateTime>($"SELECT clock_timestamp() AS \"Value\"").ToListAsync(cancellationToken))[0];

    /// <summary>Drops fractions of a second, so <c>expiresAt</c> reads like <c>04:10:00Z</c>.</summary>
    private static DateTime WholeSeconds(DateTime value) =>
        new(value.Ticks - value.Ticks % TimeSpan.TicksPerSecond, DateTimeKind.Utc);

    private static IResult HoldNotFound() =>
        ApiResults.Error(StatusCodes.Status404NotFound, ErrorCodes.NotFound,
            "This application does not exist. The link may be incomplete or wrong.");

    private static IResult ClassNotFound() =>
        ApiResults.Error(StatusCodes.Status404NotFound, ErrorCodes.NotFound,
            "This class does not exist. It may have been entered incorrectly.");

    private static IResult AlreadyApplied() =>
        ApiResults.Error(StatusCodes.Status409Conflict, ErrorCodes.AlreadyApplied,
            "This student already has an application for this class. Open My applications to see it.");

    private static IResult NotYourApplication() =>
        ApiResults.Error(StatusCodes.Status403Forbidden, ErrorCodes.NotYourApplication,
            "This application belongs to a different student. Check the student ID at the top of the page.");

    private static IResult HoldExpired() =>
        ApiResults.Error(StatusCodes.Status409Conflict, ErrorCodes.HoldExpired,
            "The time to pay for this application has run out, so the seat was released. Apply again if a seat is free.");

    private static IResult HoldCancelled() =>
        ApiResults.Error(StatusCodes.Status409Conflict, ErrorCodes.HoldCancelled,
            "This application was cancelled, so it can no longer be paid for. Apply again if a seat is free.");

    private static IResult AlreadyCancelled() =>
        ApiResults.Error(StatusCodes.Status409Conflict, ErrorCodes.HoldCancelled,
            "This application is already cancelled.");

    private static IResult AlreadyConfirmed() =>
        ApiResults.Error(StatusCodes.Status409Conflict, ErrorCodes.HoldConfirmed,
            "The fee for this application is already paid, so the admission cannot be cancelled here.");

    private static IResult ClassFull() =>
        ApiResults.Error(StatusCodes.Status409Conflict, ErrorCodes.ClassFull,
            "All seats in this class are taken. A seat may open up if another application expires or is cancelled.");
}
