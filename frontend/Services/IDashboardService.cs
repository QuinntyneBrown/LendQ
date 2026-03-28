using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface IDashboardService
{
    Task<DashboardSummary> GetSummaryAsync();
    Task<List<LoanSummary>> GetDashboardLoansAsync();
    Task<List<ActivityItem>> GetActivityAsync();
}
