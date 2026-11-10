using Admission.Api.Data;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Admission.Api.Students;
using Microsoft.EntityFrameworkCore;

namespace Admission.Api.Features.Holds;

public static class HoldEndpoints
{
    public static IEndpointRouteBuilder MapHoldEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/classes/{classId}/holds", CreateHoldAsync);

        return app;
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

        var takenSeats = await db.Holds.CountAsync(h => h.ClassId == classId
            && (h.Status == HoldStatus.Confirmed
                || (h.Status == HoldStatus.Held && h.ExpiresAt > now)),
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
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Results.Created($"/holds/{hold.Id}", CreatedHoldResponse.From(hold));
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

    private static IResult ClassNotFound() =>
        ApiResults.Error(StatusCodes.Status404NotFound, ErrorCodes.NotFound,
            "This class does not exist. It may have been entered incorrectly.");

    private static IResult ClassFull() =>
        ApiResults.Error(StatusCodes.Status409Conflict, ErrorCodes.ClassFull,
            "All seats in this class are taken. A seat may open up if another application expires or is cancelled.");
}
