using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class Role
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = "";

    [JsonPropertyName("label")]
    public string Label { get; set; } = "";

    [JsonPropertyName("permissions")]
    public List<string> Permissions { get; set; } = new();
}
