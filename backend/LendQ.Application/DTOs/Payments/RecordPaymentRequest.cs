namespace LendQ.Application.DTOs.Payments;

public class RecordPaymentRequest
{
    public decimal Amount { get; set; }
    public DateTime PostedAt { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
