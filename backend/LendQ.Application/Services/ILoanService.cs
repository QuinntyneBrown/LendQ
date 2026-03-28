using LendQ.Application.DTOs.Loans;
using LendQ.Application.DTOs.Loans.ChangeRequests;

namespace LendQ.Application.Services;

public interface ILoanService
{
    Task<LoanDetailResponse> CreateLoanAsync(CreateLoanRequest request, Guid creditorId);
    Task<LoanDetailResponse> GetByIdAsync(Guid loanId);
    Task<IReadOnlyList<LoanSummaryResponse>> GetLoansAsync(Guid userId);
    Task<LoanDetailResponse> UpdateLoanAsync(Guid loanId, UpdateLoanRequest request, Guid userId);
    Task<IReadOnlyList<LoanTermsVersionResponse>> GetTermsVersionsAsync(Guid loanId);
    Task<IReadOnlyList<ChangeRequestResponse>> GetChangeRequestsAsync(Guid loanId);
    Task<ChangeRequestResponse> CreateChangeRequestAsync(Guid loanId, CreateChangeRequestRequest request, Guid userId);
    Task<ChangeRequestResponse> ApproveChangeRequestAsync(Guid loanId, Guid changeRequestId, Guid userId);
    Task<ChangeRequestResponse> RejectChangeRequestAsync(Guid loanId, Guid changeRequestId, Guid userId);
}
