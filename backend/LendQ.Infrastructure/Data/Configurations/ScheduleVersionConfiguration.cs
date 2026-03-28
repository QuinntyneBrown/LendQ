using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class ScheduleVersionConfiguration : IEntityTypeConfiguration<ScheduleVersion>
{
    public void Configure(EntityTypeBuilder<ScheduleVersion> builder)
    {
        builder.ToTable("schedule_versions");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at");

        builder.Property(s => s.LoanId).HasColumnName("loan_id");
        builder.Property(s => s.Version).HasColumnName("version");
        builder.Property(s => s.EffectiveAt).HasColumnName("effective_at");

        builder.HasMany(s => s.Installments).WithOne(i => i.ScheduleVersion).HasForeignKey(i => i.ScheduleVersionId);
    }
}
