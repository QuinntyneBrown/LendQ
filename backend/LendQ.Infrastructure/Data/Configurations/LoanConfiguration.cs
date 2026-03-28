using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class LoanConfiguration : IEntityTypeConfiguration<Loan>
{
    public void Configure(EntityTypeBuilder<Loan> builder)
    {
        builder.ToTable("loans");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasColumnName("id");
        builder.Property(l => l.CreatedAt).HasColumnName("created_at");
        builder.Property(l => l.UpdatedAt).HasColumnName("updated_at");

        builder.Property(l => l.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(l => l.PrincipalAmount).HasColumnName("principal_amount").HasColumnType("decimal(12,2)");
        builder.Property(l => l.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(l => l.Status).HasColumnName("status").HasConversion<string>();
        builder.Property(l => l.Notes).HasColumnName("notes");

        builder.Property(l => l.BorrowerId).HasColumnName("borrower_id");
        builder.Property(l => l.CreditorId).HasColumnName("creditor_id");

        builder.HasOne(l => l.Borrower).WithMany().HasForeignKey(l => l.BorrowerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(l => l.Creditor).WithMany().HasForeignKey(l => l.CreditorId).OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(l => l.TermsVersions).WithOne(t => t.Loan).HasForeignKey(t => t.LoanId);
        builder.HasMany(l => l.ScheduleVersions).WithOne(s => s.Loan).HasForeignKey(s => s.LoanId);
        builder.HasMany(l => l.PaymentTransactions).WithOne(p => p.Loan).HasForeignKey(p => p.LoanId);
        builder.HasMany(l => l.ChangeRequests).WithOne(c => c.Loan).HasForeignKey(c => c.LoanId);
    }
}
