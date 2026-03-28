using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class AuditEventConfiguration : IEntityTypeConfiguration<AuditEvent>
{
    public void Configure(EntityTypeBuilder<AuditEvent> builder)
    {
        builder.ToTable("audit_events");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");
        builder.Property(a => a.CreatedAt).HasColumnName("created_at");
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at");

        builder.Property(a => a.EventType).HasColumnName("event_type").HasMaxLength(100).IsRequired();
        builder.Property(a => a.UserId).HasColumnName("user_id");
        builder.Property(a => a.UserEmail).HasColumnName("user_email").HasMaxLength(320);
        builder.Property(a => a.Description).HasColumnName("description");
        builder.Property(a => a.MetadataJson).HasColumnName("metadata_json");
        builder.Property(a => a.IpAddress).HasColumnName("ip_address").HasMaxLength(45);
        builder.Property(a => a.RequestId).HasColumnName("request_id").HasMaxLength(100);

        builder.HasIndex(a => a.EventType);
        builder.HasIndex(a => a.UserId);
    }
}
