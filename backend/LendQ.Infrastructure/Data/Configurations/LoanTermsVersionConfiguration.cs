using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class LoanTermsVersionConfiguration : IEntityTypeConfiguration<LoanTermsVersion>
{
    public void Configure(EntityTypeBuilder<LoanTermsVersion> builder)
    {
        builder.ToTable("loan_terms_versions");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");
        builder.Property(t => t.CreatedAt).HasColumnName("created_at");
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at");

        builder.Property(t => t.LoanId).HasColumnName("loan_id");
        builder.Property(t => t.Version).HasColumnName("version");
        builder.Property(t => t.EffectiveAt).HasColumnName("effective_at");
        builder.Property(t => t.Reason).HasColumnName("reason").HasMaxLength(500);
        builder.Property(t => t.PrincipalAmount).HasColumnName("principal_amount").HasColumnType("decimal(12,2)");
        builder.Property(t => t.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(t => t.InterestRatePercent).HasColumnName("interest_rate_percent").HasColumnType("decimal(12,2)");
        builder.Property(t => t.RepaymentFrequency).HasColumnName("repayment_frequency").HasConversion<string>();
        builder.Property(t => t.InstallmentCount).HasColumnName("installment_count");
        builder.Property(t => t.MaturityDate).HasColumnName("maturity_date");
        builder.Property(t => t.StartDate).HasColumnName("start_date");
    }
}
