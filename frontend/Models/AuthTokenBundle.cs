using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class AuthTokenBundle
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = "";

    [JsonPropertyName("expires_in_seconds")]
    public int ExpiresInSeconds { get; set; }

    [JsonPropertyName("user")]
    public UserSummary User { get; set; } = new();
}
