using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class PaymentAllocationConfiguration : IEntityTypeConfiguration<PaymentAllocation>
{
    public void Configure(EntityTypeBuilder<PaymentAllocation> builder)
    {
        builder.ToTable("payment_allocations");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");
        builder.Property(a => a.CreatedAt).HasColumnName("created_at");
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at");

        builder.Property(a => a.PaymentTransactionId).HasColumnName("payment_transaction_id");
        builder.Property(a => a.InstallmentId).HasColumnName("installment_id");
        builder.Property(a => a.Amount).HasColumnName("amount").HasColumnType("decimal(12,2)");

        builder.HasOne(a => a.Installment).WithMany().HasForeignKey(a => a.InstallmentId);
    }
}
