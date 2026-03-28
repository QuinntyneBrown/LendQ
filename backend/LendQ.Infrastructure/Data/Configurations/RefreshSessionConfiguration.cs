using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class RefreshSessionConfiguration : IEntityTypeConfiguration<RefreshSession>
{
    public void Configure(EntityTypeBuilder<RefreshSession> builder)
    {
        builder.ToTable("refresh_sessions");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at");

        builder.Property(s => s.UserId).HasColumnName("user_id");
        builder.Property(s => s.TokenHash).HasColumnName("token_hash").IsRequired();
        builder.Property(s => s.Version).HasColumnName("version");
        builder.Property(s => s.ExpiresAt).HasColumnName("expires_at");
        builder.Property(s => s.LastSeenAt).HasColumnName("last_seen_at");
        builder.Property(s => s.UserAgent).HasColumnName("user_agent");
        builder.Property(s => s.IpAddress).HasColumnName("ip_address");
        builder.Property(s => s.IsRevoked).HasColumnName("is_revoked");

        builder.HasIndex(s => s.TokenHash);
        builder.HasIndex(s => s.UserId);
    }
}
