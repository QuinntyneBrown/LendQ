using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class LoanSummary
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("counterparty_name")]
    public string CounterpartyName { get; set; } = "";

    [JsonPropertyName("principal_amount")]
    public decimal PrincipalAmount { get; set; }

    [JsonPropertyName("outstanding_balance")]
    public decimal OutstandingBalance { get; set; }

    [JsonPropertyName("next_due_date")]
    public string? NextDueDate { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "";
}
