using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class PaymentTransaction
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("loan_id")]
    public string LoanId { get; set; } = "";

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("posted_at")]
    public DateTime PostedAt { get; set; }

    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; set; } = "";

    [JsonPropertyName("direction")]
    public string Direction { get; set; } = "";

    [JsonPropertyName("transaction_type")]
    public string TransactionType { get; set; } = "";

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("allocations")]
    public List<PaymentAllocation>? Allocations { get; set; }
}
