using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class ScheduleInstallmentConfiguration : IEntityTypeConfiguration<ScheduleInstallment>
{
    public void Configure(EntityTypeBuilder<ScheduleInstallment> builder)
    {
        builder.ToTable("schedule_installments");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.CreatedAt).HasColumnName("created_at");
        builder.Property(i => i.UpdatedAt).HasColumnName("updated_at");

        builder.Property(i => i.ScheduleVersionId).HasColumnName("schedule_version_id");
        builder.Property(i => i.Sequence).HasColumnName("sequence");
        builder.Property(i => i.DueDate).HasColumnName("due_date");
        builder.Property(i => i.AmountDue).HasColumnName("amount_due").HasColumnType("decimal(12,2)");
        builder.Property(i => i.AmountPaid).HasColumnName("amount_paid").HasColumnType("decimal(12,2)");
        builder.Property(i => i.Status).HasColumnName("status").HasConversion<string>();
        builder.Property(i => i.OriginalDueDate).HasColumnName("original_due_date");
    }
}
