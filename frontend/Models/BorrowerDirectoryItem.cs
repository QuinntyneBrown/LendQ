using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class BorrowerDirectoryItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("email")]
    public string Email { get; set; } = "";
}
