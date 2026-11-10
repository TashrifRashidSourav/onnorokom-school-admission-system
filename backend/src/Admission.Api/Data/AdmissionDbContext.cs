using Admission.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Admission.Api.Data;

public class AdmissionDbContext(DbContextOptions<AdmissionDbContext> options) : DbContext(options)
{
    /// <summary>SQL filter for holds that occupy a seat. Kept in one place for the index.</summary>
    public const string ActiveHoldFilter = "status IN ('HELD', 'CONFIRMED')";

    /// <summary>Unique index allowing one active hold per student per class.</summary>
    public const string ActiveHoldIndex = "ux_holds_active_class_student";

    public DbSet<SchoolClass> Classes => Set<SchoolClass>();

    public DbSet<Hold> Holds => Set<Hold>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SchoolClass>(entity =>
        {
            entity.ToTable("classes", t =>
                t.HasCheckConstraint("ck_classes_total_seats_positive", "total_seats > 0"));

            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id").HasMaxLength(40);
            entity.Property(c => c.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.Property(c => c.TotalSeats).HasColumnName("total_seats");
            entity.Property(c => c.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<Hold>(entity =>
        {
            entity.ToTable("holds", t =>
                t.HasCheckConstraint(
                    "ck_holds_status",
                    "status IN ('HELD', 'CONFIRMED', 'EXPIRED', 'CANCELLED')"));

            entity.HasKey(h => h.Id);
            entity.Property(h => h.Id).HasColumnName("id").HasMaxLength(40);
            entity.Property(h => h.ClassId).HasColumnName("class_id").HasMaxLength(40);
            entity.Property(h => h.StudentId).HasColumnName("student_id").HasMaxLength(17).IsRequired();

            // Stored exactly as the API returns it: HELD, CONFIRMED, EXPIRED, CANCELLED.
            entity.Property(h => h.Status)
                .HasColumnName("status")
                .HasMaxLength(16)
                .HasConversion(
                    status => status.ToString().ToUpperInvariant(),
                    value => Enum.Parse<HoldStatus>(value, true));

            entity.Property(h => h.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(h => h.ExpiresAt).HasColumnName("expires_at");
            entity.Property(h => h.ConfirmedAt).HasColumnName("confirmed_at");

            entity.HasOne(h => h.Class)
                .WithMany(c => c.Holds)
                .HasForeignKey(h => h.ClassId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seat counting per class filters on status and expiry.
            entity.HasIndex(h => new { h.ClassId, h.Status, h.ExpiresAt })
                .HasDatabaseName("ix_holds_class_status_expires");

            // "My applications" lookup.
            entity.HasIndex(h => h.StudentId).HasDatabaseName("ix_holds_student_id");

            // Second line of defence for rule 3: at most one active (HELD or CONFIRMED)
            // hold per student per class, even if two requests race.
            entity.HasIndex(h => new { h.ClassId, h.StudentId })
                .IsUnique()
                .HasFilter(ActiveHoldFilter)
                .HasDatabaseName(ActiveHoldIndex);
        });
    }
}
