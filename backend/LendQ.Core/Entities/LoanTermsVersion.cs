using LendQ.Core.Enums;

namespace LendQ.Core.Entities;

public class LoanTermsVersion : BaseEntity
{
    public Guid LoanId { get; set; }
    public Loan Loan { get; set; } = null!;

    public int Version { get; set; }
    public DateTime EffectiveAt { get; set; } = DateTime.UtcNow;
    public string Reason { get; set; } = string.Empty;
    public decimal PrincipalAmount { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal? InterestRatePercent { get; set; }
    public RepaymentFrequency RepaymentFrequency { get; set; }
    public int? InstallmentCount { get; set; }
    public DateOnly? MaturityDate { get; set; }
    public DateOnly StartDate { get; set; }
}
