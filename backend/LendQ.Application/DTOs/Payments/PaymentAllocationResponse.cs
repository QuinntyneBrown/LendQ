namespace LendQ.Application.DTOs.Payments;

public class PaymentAllocationResponse
{
    public Guid InstallmentId { get; init; }
    public string Amount { get; init; } = string.Empty;
}
