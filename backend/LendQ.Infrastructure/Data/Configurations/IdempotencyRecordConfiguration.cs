using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class IdempotencyRecordConfiguration : IEntityTypeConfiguration<IdempotencyRecord>
{
    public void Configure(EntityTypeBuilder<IdempotencyRecord> builder)
    {
        builder.ToTable("idempotency_records");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id");
        builder.Property(r => r.CreatedAt).HasColumnName("created_at");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at");

        builder.Property(r => r.Key).HasColumnName("key").IsRequired();
        builder.Property(r => r.ResponseJson).HasColumnName("response_json");
        builder.Property(r => r.StatusCode).HasColumnName("status_code");
        builder.Property(r => r.ExpiresAt).HasColumnName("expires_at");

        builder.HasIndex(r => r.Key).IsUnique();
    }
}
