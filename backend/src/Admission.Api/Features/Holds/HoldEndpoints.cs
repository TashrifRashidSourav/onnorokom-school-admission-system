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

        var totalSeats = await db.Classes
            .Where(c => c.Id == classId)
            .Select(c => (int?)c.TotalSeats)
            .SingleOrDefaultAsync(cancellationToken);
        if (totalSeats is null)
        {
            return ClassNotFound();
        }

        var takenSeats = await db.Holds.CountAsync(h => h.ClassId == classId
            && (h.Status == HoldStatus.Confirmed
                || (h.Status == HoldStatus.Held && h.ExpiresAt > DateTime.UtcNow)),
            cancellationToken);
        if (takenSeats >= totalSeats)
        {
            return ClassFull();
        }

        var now = await DatabaseNowAsync(db, cancellationToken);
        var hold = new Hold
        {
            ClassId = classId,
            StudentId = studentId.Value,
            Status = HoldStatus.Held,
            ExpiresAt = WholeSeconds(now + settings.Duration),
        };
        db.Holds.Add(hold);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/holds/{hold.Id}", CreatedHoldResponse.From(hold));
    }

    /// <summary>The database clock, which every backend process shares.</summary>
    private static async Task<DateTime> DatabaseNowAsync(AdmissionDbContext db, CancellationToken cancellationToken) =>
        (await db.Database.SqlQuery<DateTime>($"SELECT now() AS \"Value\"").ToListAsync(cancellationToken))[0];

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
