using LendQ.Core.Enums;

namespace LendQ.Core.Entities;

public class PaymentTransaction : BaseEntity
{
    public Guid LoanId { get; set; }
    public Loan Loan { get; set; } = null!;

    public decimal Amount { get; set; }
    public DateTime PostedAt { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentDirection Direction { get; set; }
    public TransactionType TransactionType { get; set; }
    public string? Notes { get; set; }
    public string? IdempotencyKey { get; set; }

    public Guid? ReversedTransactionId { get; set; }
    public PaymentTransaction? ReversedTransaction { get; set; }

    public ICollection<PaymentAllocation> Allocations { get; set; } = new List<PaymentAllocation>();
}
