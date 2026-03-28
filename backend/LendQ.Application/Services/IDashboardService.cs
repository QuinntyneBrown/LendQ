using LendQ.Application.DTOs.Dashboard;
using LendQ.Application.DTOs.Loans;

namespace LendQ.Application.Services;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId);
    Task<IReadOnlyList<LoanSummaryResponse>> GetLoansAsync(Guid userId);
    Task<IReadOnlyList<ActivityItemResponse>> GetActivityAsync(Guid userId);
}
