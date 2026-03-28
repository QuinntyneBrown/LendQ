using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");

        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).HasColumnName("id");
        builder.Property(n => n.CreatedAt).HasColumnName("created_at");
        builder.Property(n => n.UpdatedAt).HasColumnName("updated_at");

        builder.Property(n => n.UserId).HasColumnName("user_id");
        builder.Property(n => n.Type).HasColumnName("type").HasConversion<string>();
        builder.Property(n => n.Title).HasColumnName("title").HasMaxLength(300);
        builder.Property(n => n.Body).HasColumnName("body");
        builder.Property(n => n.IsRead).HasColumnName("is_read");
        builder.Property(n => n.RelatedLoanId).HasColumnName("related_loan_id");

        builder.HasIndex(n => n.UserId);
    }
}
