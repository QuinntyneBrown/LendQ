namespace LendQ.Application.DTOs.Dashboard;

public class DashboardSummaryResponse
{
    public string TotalLentOut { get; init; } = string.Empty;
    public string TotalOwed { get; init; } = string.Empty;
    public int UpcomingPayments7d { get; init; }
    public int OverduePayments { get; init; }
    public DateTime GeneratedAt { get; init; }
    public int? ProjectionLagSeconds { get; init; }
}
