using LendQ.Core.Enums;

namespace LendQ.Core.Entities;

public class LoanChangeRequest : BaseEntity
{
    public Guid LoanId { get; set; }
    public Loan Loan { get; set; } = null!;

    public ChangeRequestType Type { get; set; }
    public ChangeRequestStatus Status { get; set; } = ChangeRequestStatus.Pending;
    public string Reason { get; set; } = string.Empty;
    public string? ProposedTermsJson { get; set; }

    public Guid RequestedById { get; set; }
    public User RequestedBy { get; set; } = null!;
}
