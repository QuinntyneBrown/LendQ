using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class ScheduleInstallment
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("sequence")]
    public int Sequence { get; set; }

    [JsonPropertyName("due_date")]
    public string DueDate { get; set; } = "";

    [JsonPropertyName("amount_due")]
    public decimal AmountDue { get; set; }

    [JsonPropertyName("amount_paid")]
    public decimal AmountPaid { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "";

    [JsonPropertyName("original_due_date")]
    public string? OriginalDueDate { get; set; }
}
