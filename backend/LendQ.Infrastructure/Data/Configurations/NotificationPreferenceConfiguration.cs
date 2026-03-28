using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class NotificationPreferenceConfiguration : IEntityTypeConfiguration<NotificationPreference>
{
    public void Configure(EntityTypeBuilder<NotificationPreference> builder)
    {
        builder.ToTable("notification_preferences");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.CreatedAt).HasColumnName("created_at");
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at");

        builder.Property(p => p.UserId).HasColumnName("user_id");
        builder.Property(p => p.PaymentDueEmail).HasColumnName("payment_due_email");
        builder.Property(p => p.PaymentOverdueEmail).HasColumnName("payment_overdue_email");
        builder.Property(p => p.PaymentReceivedEmail).HasColumnName("payment_received_email");
        builder.Property(p => p.ScheduleChangedEmail).HasColumnName("schedule_changed_email");
        builder.Property(p => p.LoanModifiedEmail).HasColumnName("loan_modified_email");
        builder.Property(p => p.SystemEmail).HasColumnName("system_email");

        builder.HasIndex(p => p.UserId).IsUnique();
    }
}
