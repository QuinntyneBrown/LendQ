using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class PaymentAllocation
{
    [JsonPropertyName("installment_id")]
    public string InstallmentId { get; set; } = "";

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}
