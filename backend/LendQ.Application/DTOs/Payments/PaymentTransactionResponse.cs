namespace LendQ.Application.DTOs.Payments;

public class PaymentTransactionResponse
{
    public Guid Id { get; init; }
    public Guid LoanId { get; init; }
    public string Amount { get; init; } = string.Empty;
    public DateTime PostedAt { get; init; }
    public string PaymentMethod { get; init; } = string.Empty;
    public string Direction { get; init; } = string.Empty;
    public string TransactionType { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public List<PaymentAllocationResponse> Allocations { get; init; } = new();
}
