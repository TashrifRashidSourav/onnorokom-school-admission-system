using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Admission.Api.Data;

/// <summary>
/// Lets <c>dotnet ef migrations add</c> build the model without starting the app
/// or reaching a database.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AdmissionDbContext>
{
    public AdmissionDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AdmissionDbContext>()
            .UseNpgsql("Host=localhost;Database=admission;Username=admission;Password=admission")
            .Options;

        return new AdmissionDbContext(options);
    }
}
