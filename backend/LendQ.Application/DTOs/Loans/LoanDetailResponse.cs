using LendQ.Application.DTOs.Users;

namespace LendQ.Application.DTOs.Loans;

public class LoanDetailResponse : LoanSummaryResponse
{
    public UserResponse Borrower { get; init; } = null!;
    public UserResponse Creditor { get; init; } = null!;
    public LoanTermsVersionResponse CurrentTermsVersion { get; init; } = null!;
    public ScheduleVersionResponse CurrentScheduleVersion { get; init; } = null!;
}
