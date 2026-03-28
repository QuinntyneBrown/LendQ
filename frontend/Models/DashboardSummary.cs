using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class DashboardSummary
{
    [JsonPropertyName("total_lent_out")]
    public decimal TotalLentOut { get; set; }

    [JsonPropertyName("total_owed")]
    public decimal TotalOwed { get; set; }

    [JsonPropertyName("upcoming_payments_7d")]
    public int UpcomingPayments7d { get; set; }

    [JsonPropertyName("overdue_payments")]
    public int OverduePayments { get; set; }

    [JsonPropertyName("generated_at")]
    public DateTime GeneratedAt { get; set; }

    [JsonPropertyName("projection_lag_seconds")]
    public int? ProjectionLagSeconds { get; set; }
}
