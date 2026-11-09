using Admission.Api.Data;
using Admission.Api.Domain;
using Admission.Api.Errors;

namespace Admission.Api.Features.Classes;

public static class ClassEndpoints
{
    public static IEndpointRouteBuilder MapClassEndpoints(this IEndpointRouteBuilder app)
    {
        var classes = app.MapGroup("/classes");

        classes.MapPost("/", CreateClassAsync);

        return app;
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
