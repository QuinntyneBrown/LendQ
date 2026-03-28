using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class ActivityItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("loan_id")]
    public string? LoanId { get; set; }
}
