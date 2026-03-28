using LendQ.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LendQ.Infrastructure.Data.Configurations;

public class LoanChangeRequestConfiguration : IEntityTypeConfiguration<LoanChangeRequest>
{
    public void Configure(EntityTypeBuilder<LoanChangeRequest> builder)
    {
        builder.ToTable("loan_change_requests");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.CreatedAt).HasColumnName("created_at");
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at");

        builder.Property(c => c.LoanId).HasColumnName("loan_id");
        builder.Property(c => c.Type).HasColumnName("type").HasConversion<string>();
        builder.Property(c => c.Status).HasColumnName("status").HasConversion<string>();
        builder.Property(c => c.Reason).HasColumnName("reason").HasMaxLength(1000);
        builder.Property(c => c.ProposedTermsJson).HasColumnName("proposed_terms_json");
        builder.Property(c => c.RequestedById).HasColumnName("requested_by_id");

        builder.HasOne(c => c.RequestedBy).WithMany().HasForeignKey(c => c.RequestedById);
    }
}
