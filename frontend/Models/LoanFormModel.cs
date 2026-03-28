using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class LoanFormModel
{
    [Required]
    public string BorrowerId { get; set; } = "";

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = "";

    [Required]
    public decimal PrincipalAmount { get; set; }

    [Required]
    [StringLength(3, MinimumLength = 3)]
    public string Currency { get; set; } = "";

    public decimal? InterestRatePercent { get; set; }

    [Required]
    public string RepaymentFrequency { get; set; } = "";

    public int? InstallmentCount { get; set; }

    public string? MaturityDate { get; set; }

    [Required]
    public string StartDate { get; set; } = "";

    public string? Notes { get; set; }

    public List<CustomScheduleRowModel>? CustomSchedule { get; set; }
}
