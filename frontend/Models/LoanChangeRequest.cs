using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class LoanChangeRequest
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("status")]
    public string Status { get; set; } = "";

    [JsonPropertyName("requested_by")]
    public UserSummary RequestedBy { get; set; } = new();

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = "";

    [JsonPropertyName("proposed_terms")]
    public Dictionary<string, object>? ProposedTerms { get; set; }
}
