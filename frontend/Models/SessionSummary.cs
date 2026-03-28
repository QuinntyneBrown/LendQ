using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class SessionSummary
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("last_seen_at")]
    public DateTime LastSeenAt { get; set; }

    [JsonPropertyName("is_current")]
    public bool IsCurrent { get; set; }

    [JsonPropertyName("user_agent")]
    public string UserAgent { get; set; } = "";

    [JsonPropertyName("ip_address")]
    public string? IpAddress { get; set; }

    [JsonPropertyName("location_hint")]
    public string? LocationHint { get; set; }
}
