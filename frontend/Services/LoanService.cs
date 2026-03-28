using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class LoanService : ILoanService
{
    private readonly HttpClient _http;

    public LoanService(HttpClient http)
    {
        _http = http;
    }

    public event Action? OnChange;

    public async Task<PaginatedResponse<LoanSummary>> GetLoansAsync(int page = 1, string? status = null, string? search = null)
    {
        var query = new List<string> { $"page={page}" };

        if (!string.IsNullOrWhiteSpace(status))
            query.Add($"status={Uri.EscapeDataString(status)}");
        if (!string.IsNullOrWhiteSpace(search))
            query.Add($"search={Uri.EscapeDataString(search)}");

        var url = $"loans?{string.Join("&", query)}";
        return await _http.GetFromJsonAsync<PaginatedResponse<LoanSummary>>(url)
            ?? new PaginatedResponse<LoanSummary>();
    }

    public async Task<LoanDetail> GetLoanDetailAsync(string id)
    {
        return await _http.GetFromJsonAsync<LoanDetail>($"loans/{id}")
            ?? throw new InvalidOperationException("Loan not found.");
    }

    public async Task<LoanDetail> CreateLoanAsync(LoanFormModel model)
    {
        var response = await _http.PostAsJsonAsync("loans", model);
        response.EnsureSuccessStatusCode();
        var loan = await response.Content.ReadFromJsonAsync<LoanDetail>()
            ?? throw new InvalidOperationException("Create loan response was null.");
        OnChange?.Invoke();
        return loan;
    }

    public async Task<LoanDetail> UpdateLoanAsync(string id, LoanFormModel model, int expectedTermsVersion)
    {
        var payload = new
        {
            model.BorrowerId,
            model.Description,
            model.PrincipalAmount,
            model.Currency,
            model.InterestRatePercent,
            model.RepaymentFrequency,
            model.InstallmentCount,
            model.MaturityDate,
            model.StartDate,
            model.Notes,
            model.CustomSchedule,
            expected_terms_version = expectedTermsVersion
        };
        var response = await _http.PutAsJsonAsync($"loans/{id}", payload);
        response.EnsureSuccessStatusCode();
        var loan = await response.Content.ReadFromJsonAsync<LoanDetail>()
            ?? throw new InvalidOperationException("Update loan response was null.");
        OnChange?.Invoke();
        return loan;
    }

    public async Task<List<LoanTermsVersion>> GetTermsHistoryAsync(string loanId)
    {
        return await _http.GetFromJsonAsync<List<LoanTermsVersion>>($"loans/{loanId}/terms")
            ?? new List<LoanTermsVersion>();
    }

    public async Task<List<LoanChangeRequest>> GetChangeRequestsAsync(string loanId)
    {
        return await _http.GetFromJsonAsync<List<LoanChangeRequest>>($"loans/{loanId}/change-requests")
            ?? new List<LoanChangeRequest>();
    }

    public async Task CreateChangeRequestAsync(string loanId, ChangeRequestFormModel model)
    {
        var response = await _http.PostAsJsonAsync($"loans/{loanId}/change-requests", model);
        response.EnsureSuccessStatusCode();
        OnChange?.Invoke();
    }

    public async Task ApproveChangeRequestAsync(string loanId, string requestId)
    {
        var response = await _http.PostAsync($"loans/{loanId}/change-requests/{requestId}/approve", null);
        response.EnsureSuccessStatusCode();
        OnChange?.Invoke();
    }

    public async Task RejectChangeRequestAsync(string loanId, string requestId)
    {
        var response = await _http.PostAsync($"loans/{loanId}/change-requests/{requestId}/reject", null);
        response.EnsureSuccessStatusCode();
        OnChange?.Invoke();
    }
}
