namespace LendQ.Application.DTOs.Loans;

public class ScheduleVersionResponse
{
    public int Version { get; init; }
    public DateTime EffectiveAt { get; init; }
    public List<ScheduleInstallmentResponse> Installments { get; init; } = new();
}
