namespace LendQ.Application.DTOs.Loans;

public class LoanTermsVersionResponse
{
    public int Version { get; init; }
    public DateTime EffectiveAt { get; init; }
    public string Reason { get; init; } = string.Empty;
    public string PrincipalAmount { get; init; } = string.Empty;
    public string Currency { get; init; } = string.Empty;
    public decimal? InterestRatePercent { get; init; }
    public string RepaymentFrequency { get; init; } = string.Empty;
    public int? InstallmentCount { get; init; }
    public DateOnly? MaturityDate { get; init; }
}
