using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class DashboardService : IDashboardService
{
    private readonly HttpClient _http;

    public DashboardService(HttpClient http)
    {
        _http = http;
    }

    public async Task<DashboardSummary> GetSummaryAsync()
    {
        return await _http.GetFromJsonAsync<DashboardSummary>("dashboard/summary")
            ?? throw new InvalidOperationException("Dashboard summary was null.");
    }

    public async Task<List<LoanSummary>> GetDashboardLoansAsync()
    {
        return await _http.GetFromJsonAsync<List<LoanSummary>>("dashboard/loans")
            ?? new List<LoanSummary>();
    }

    public async Task<List<ActivityItem>> GetActivityAsync()
    {
        return await _http.GetFromJsonAsync<List<ActivityItem>>("dashboard/activity")
            ?? new List<ActivityItem>();
    }
}
