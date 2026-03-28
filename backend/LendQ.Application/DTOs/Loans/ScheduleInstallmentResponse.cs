namespace LendQ.Application.DTOs.Loans;

public class ScheduleInstallmentResponse
{
    public Guid Id { get; init; }
    public int Sequence { get; init; }
    public DateOnly DueDate { get; init; }
    public string AmountDue { get; init; } = string.Empty;
    public string AmountPaid { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateOnly? OriginalDueDate { get; init; }
}
