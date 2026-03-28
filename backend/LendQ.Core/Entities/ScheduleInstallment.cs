using LendQ.Core.Enums;

namespace LendQ.Core.Entities;

public class ScheduleInstallment : BaseEntity
{
    public Guid ScheduleVersionId { get; set; }
    public ScheduleVersion ScheduleVersion { get; set; } = null!;

    public int Sequence { get; set; }
    public DateOnly DueDate { get; set; }
    public decimal AmountDue { get; set; }
    public decimal AmountPaid { get; set; }
    public InstallmentStatus Status { get; set; } = InstallmentStatus.Scheduled;
    public DateOnly? OriginalDueDate { get; set; }
}
