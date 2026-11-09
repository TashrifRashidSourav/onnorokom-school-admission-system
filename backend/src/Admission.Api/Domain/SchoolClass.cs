namespace Admission.Api.Domain;

/// <summary>
/// One admission "class". Each shift is its own class with its own seats,
/// e.g. "Class 6 - Morning Shift" and "Class 6 - Day Shift".
/// </summary>
public class SchoolClass
{
    public string Id { get; set; } = IdGenerator.NewClassId();

    public required string Name { get; set; }

    public int TotalSeats { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<Hold> Holds { get; set; } = [];
}
