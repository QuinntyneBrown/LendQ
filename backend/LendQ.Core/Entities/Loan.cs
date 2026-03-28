using LendQ.Core.Enums;

namespace LendQ.Core.Entities;

public class Loan : BaseEntity
{
    public string Description { get; set; } = string.Empty;
    public decimal PrincipalAmount { get; set; }
    public string Currency { get; set; } = "USD";
    public LoanStatus Status { get; set; } = LoanStatus.Active;
    public string? Notes { get; set; }

    public Guid BorrowerId { get; set; }
    public User Borrower { get; set; } = null!;

    public Guid CreditorId { get; set; }
    public User Creditor { get; set; } = null!;

    public ICollection<LoanTermsVersion> TermsVersions { get; set; } = new List<LoanTermsVersion>();
    public ICollection<ScheduleVersion> ScheduleVersions { get; set; } = new List<ScheduleVersion>();
    public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
    public ICollection<LoanChangeRequest> ChangeRequests { get; set; } = new List<LoanChangeRequest>();
}
