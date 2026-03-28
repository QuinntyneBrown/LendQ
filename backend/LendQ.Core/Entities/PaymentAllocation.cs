namespace LendQ.Core.Entities;

public class PaymentAllocation : BaseEntity
{
    public Guid PaymentTransactionId { get; set; }
    public PaymentTransaction PaymentTransaction { get; set; } = null!;

    public Guid InstallmentId { get; set; }
    public ScheduleInstallment Installment { get; set; } = null!;

    public decimal Amount { get; set; }
}
