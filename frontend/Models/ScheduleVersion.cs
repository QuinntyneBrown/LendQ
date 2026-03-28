using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class ScheduleVersion
{
    [JsonPropertyName("version")]
    public int Version { get; set; }

    [JsonPropertyName("effective_at")]
    public DateTime EffectiveAt { get; set; }

    [JsonPropertyName("installments")]
    public List<ScheduleInstallment> Installments { get; set; } = new();
}
