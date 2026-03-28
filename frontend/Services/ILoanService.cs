using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface ILoanService
{
    Task<PaginatedResponse<LoanSummary>> GetLoansAsync(int page = 1, string? status = null, string? search = null);
    Task<LoanDetail> GetLoanDetailAsync(string id);
    Task<LoanDetail> CreateLoanAsync(LoanFormModel model);
    Task<LoanDetail> UpdateLoanAsync(string id, LoanFormModel model, int expectedTermsVersion);
    Task<List<LoanTermsVersion>> GetTermsHistoryAsync(string loanId);
    Task<List<LoanChangeRequest>> GetChangeRequestsAsync(string loanId);
    Task CreateChangeRequestAsync(string loanId, ChangeRequestFormModel model);
    Task ApproveChangeRequestAsync(string loanId, string requestId);
    Task RejectChangeRequestAsync(string loanId, string requestId);
    event Action? OnChange;
}
