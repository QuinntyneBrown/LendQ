namespace LendQ.Application.DTOs.Loans;

public class UpdateLoanRequest
{
    public Guid BorrowerId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal PrincipalAmount { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal? InterestRatePercent { get; set; }
    public string RepaymentFrequency { get; set; } = string.Empty;
    public int? InstallmentCount { get; set; }
    public DateOnly? MaturityDate { get; set; }
    public DateOnly StartDate { get; set; }
    public string? Notes { get; set; }
    public List<CustomScheduleRowDto>? CustomSchedule { get; set; }
    public int ExpectedTermsVersion { get; set; }
}
