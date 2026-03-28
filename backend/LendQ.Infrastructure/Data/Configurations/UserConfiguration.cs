using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.CreatedAt).HasColumnName("created_at");
        builder.Property(u => u.UpdatedAt).HasColumnName("updated_at");

        builder.Property(u => u.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
        builder.Property(u => u.PasswordHash).HasColumnName("password_hash").IsRequired();
        builder.Property(u => u.Status).HasColumnName("status").HasConversion<string>();
        builder.Property(u => u.EmailVerified).HasColumnName("email_verified");
        builder.Property(u => u.EmailVerificationToken).HasColumnName("email_verification_token");
        builder.Property(u => u.EmailVerificationTokenExpiresAt).HasColumnName("email_verification_token_expires_at");
        builder.Property(u => u.PasswordResetToken).HasColumnName("password_reset_token");
        builder.Property(u => u.PasswordResetTokenExpiresAt).HasColumnName("password_reset_token_expires_at");

        builder.HasIndex(u => u.Email).IsUnique();

        builder.HasMany(u => u.RoleAssignments).WithOne(r => r.User).HasForeignKey(r => r.UserId);
        builder.HasMany(u => u.RefreshSessions).WithOne(s => s.User).HasForeignKey(s => s.UserId);
        builder.HasMany(u => u.Notifications).WithOne(n => n.User).HasForeignKey(n => n.UserId);
        builder.HasOne(u => u.NotificationPreference).WithOne(p => p.User).HasForeignKey<NotificationPreference>(p => p.UserId);
    }
}
