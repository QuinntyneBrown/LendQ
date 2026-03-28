using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class LoanDetail : LoanSummary
{
    [JsonPropertyName("borrower")]
    public UserSummary Borrower { get; set; } = new();

    [JsonPropertyName("creditor")]
    public UserSummary Creditor { get; set; } = new();

    [JsonPropertyName("current_terms_version")]
    public LoanTermsVersion CurrentTermsVersion { get; set; } = new();

    [JsonPropertyName("current_schedule_version")]
    public ScheduleVersion CurrentScheduleVersion { get; set; } = new();
}
