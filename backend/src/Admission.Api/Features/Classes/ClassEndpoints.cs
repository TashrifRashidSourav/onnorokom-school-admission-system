using Admission.Api.Data;
using Admission.Api.Domain;
using Admission.Api.Errors;
using Microsoft.EntityFrameworkCore;

namespace Admission.Api.Features.Classes;

public static class ClassEndpoints
{
    public static IEndpointRouteBuilder MapClassEndpoints(this IEndpointRouteBuilder app)
    {
        var classes = app.MapGroup("/classes");

        classes.MapPost("/", CreateClassAsync);
        classes.MapGet("/", ListClassesAsync);
        classes.MapGet("/{classId}", GetClassAsync);

        return app;
    }

    /// <summary>GET /classes/{classId}: seat counts of one class, 404 if it does not exist.</summary>
    private static async Task<IResult> GetClassAsync(
        string classId, AdmissionDbContext db, CancellationToken cancellationToken)
    {
        var schoolClass = await db.Classes.AsNoTracking()
            .Where(c => c.Id == classId)
            .WithSeatCounts()
            .SingleOrDefaultAsync(cancellationToken);

        return schoolClass is null
            ? ApiResults.Error(StatusCodes.Status404NotFound, ErrorCodes.NotFound,
                "This class does not exist. It may have been entered incorrectly.")
            : Results.Ok(schoolClass);
    }

    /// <summary>GET /classes: every class with its seat counts, oldest first.</summary>
    private static async Task<IResult> ListClassesAsync(
        AdmissionDbContext db, CancellationToken cancellationToken)
    {
        var classes = await db.Classes.AsNoTracking().WithSeatCounts().ToListAsync(cancellationToken);
        return Results.Ok(classes);
    }

    /// <summary>POST /classes: school admin creates a class (one shift) with its seats.</summary>
    private static async Task<IResult> CreateClassAsync(
        CreateClassRequest? request, AdmissionDbContext db, CancellationToken cancellationToken)
    {
        if (CreateClassValidator.Validate(request) is { } error)
        {
            return Results.Json(error, statusCode: StatusCodes.Status400BadRequest);
        }

        var schoolClass = new SchoolClass
        {
            Name = request!.Name!.Trim(),
            TotalSeats = request.TotalSeats!.Value,
        };

        db.Classes.Add(schoolClass);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/classes/{schoolClass.Id}", CreatedClassResponse.From(schoolClass));
    }
}
