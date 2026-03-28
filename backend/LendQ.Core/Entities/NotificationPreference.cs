namespace LendQ.Core.Entities;

public class NotificationPreference : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public bool PaymentDueEmail { get; set; } = true;
    public bool PaymentOverdueEmail { get; set; } = true;
    public bool PaymentReceivedEmail { get; set; } = true;
    public bool ScheduleChangedEmail { get; set; } = true;
    public bool LoanModifiedEmail { get; set; } = true;
    public bool SystemEmail { get; set; } = true;
}
