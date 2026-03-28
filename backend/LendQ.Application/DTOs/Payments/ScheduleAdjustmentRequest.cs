namespace LendQ.Application.DTOs.Payments;

public class ScheduleAdjustmentRequest
{
    public List<Guid> InstallmentIds { get; set; } = new();
    public DateOnly? NewDueDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? RequestedMode { get; set; }
}
