using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class ErrorResponse
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = "";

    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("request_id")]
    public string RequestId { get; set; } = "";

    [JsonPropertyName("details")]
    public Dictionary<string, string[]>? Details { get; set; }
}
