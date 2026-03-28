using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class LoanTermsVersion
{
    [JsonPropertyName("version")]
    public int Version { get; set; }

    [JsonPropertyName("effective_at")]
    public DateTime EffectiveAt { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = "";

    [JsonPropertyName("principal_amount")]
    public decimal? PrincipalAmount { get; set; }

    [JsonPropertyName("currency")]
    public string? Currency { get; set; }

    [JsonPropertyName("interest_rate_percent")]
    public decimal? InterestRatePercent { get; set; }

    [JsonPropertyName("repayment_frequency")]
    public string? RepaymentFrequency { get; set; }

    [JsonPropertyName("installment_count")]
    public int? InstallmentCount { get; set; }

    [JsonPropertyName("maturity_date")]
    public string? MaturityDate { get; set; }
}
