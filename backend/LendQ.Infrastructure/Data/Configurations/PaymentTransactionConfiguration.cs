using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        builder.ToTable("payment_transactions");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.CreatedAt).HasColumnName("created_at");
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at");

        builder.Property(p => p.LoanId).HasColumnName("loan_id");
        builder.Property(p => p.Amount).HasColumnName("amount").HasColumnType("decimal(12,2)");
        builder.Property(p => p.PostedAt).HasColumnName("posted_at");
        builder.Property(p => p.PaymentMethod).HasColumnName("payment_method").HasConversion<string>();
        builder.Property(p => p.Direction).HasColumnName("direction").HasConversion<string>();
        builder.Property(p => p.TransactionType).HasColumnName("transaction_type").HasConversion<string>();
        builder.Property(p => p.Notes).HasColumnName("notes");
        builder.Property(p => p.IdempotencyKey).HasColumnName("idempotency_key");
        builder.Property(p => p.ReversedTransactionId).HasColumnName("reversed_transaction_id");

        builder.HasIndex(p => p.IdempotencyKey)
            .IsUnique()
            .HasFilter("idempotency_key IS NOT NULL");

        builder.HasOne(p => p.ReversedTransaction).WithMany().HasForeignKey(p => p.ReversedTransactionId);
        builder.HasMany(p => p.Allocations).WithOne(a => a.PaymentTransaction).HasForeignKey(a => a.PaymentTransactionId);
    }
}
